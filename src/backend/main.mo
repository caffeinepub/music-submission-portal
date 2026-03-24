import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();

  // Seed permanent admin principals (draft + live) so they are always admin
  // regardless of deployment order or URL.
  do {
    let draftAdmin = Principal.fromText("mqpqn-qsle4-usj5i-uytxj-pzbwu-3ppcx-cqjq5-qtktf-nwxvx-szbij-bae");
    let liveAdmin  = Principal.fromText("jkkxl-3bedb-xmmyb-nf33k-gynuj-ufu2s-c5gce-gm7x7-x44kq-lyjg7-dae");
    accessControlState.userRoles.add(draftAdmin, #admin);
    accessControlState.userRoles.add(liveAdmin,  #admin);
    accessControlState.adminAssigned := true;
  };

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type SocialLinks = {
    instagram : ?Text;
    spotify : ?Text;
    soundcloud : ?Text;
    youtube : ?Text;
  };

  public type SubmissionLabel = {
    #archived;
    #shortlisted;
    #faved;
  };

  public type SubmissionStatus = {
    #pending;
    #reviewed;
    #accepted;
    #rejected;
  };

  public type Tab = {
    #archived;
    #shortlisted;
    #faved;
    #newSubmissions;
  };

  // Stable storage type -- do NOT add fields here without a migration
  type Submission = {
    id : Text;
    bandName : Text;
    genre : Text;
    specificGenre : ?Text;
    website : ?Text;
    submitterName : ?Text;
    submitterEmail : ?Text;
    submitterRole : ?Text;
    socialLinks : SocialLinks;
    epkBlob : ?Storage.ExternalBlob;
    trackBlobs : [Storage.ExternalBlob];
    status : SubmissionStatus;
    isArchived : Bool;
    isShortlisted : Bool;
    isFaved : Bool;
    submittedAt : Int.Int;
  };

  // Separate stable map for filenames (avoids Submission type migration)
  type FileInfo = {
    epkFilename : ?Text;
    trackFilenames : [Text];
  };

  // Public return type that includes filenames
  public type SubmissionView = {
    id : Text;
    bandName : Text;
    genre : Text;
    specificGenre : ?Text;
    website : ?Text;
    submitterName : ?Text;
    submitterEmail : ?Text;
    submitterRole : ?Text;
    socialLinks : SocialLinks;
    epkBlob : ?Storage.ExternalBlob;
    epkFilename : ?Text;
    trackBlobs : [Storage.ExternalBlob];
    trackFilenames : [Text];
    status : SubmissionStatus;
    isArchived : Bool;
    isShortlisted : Bool;
    isFaved : Bool;
    submittedAt : Int.Int;
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let submissions = Map.empty<Text, Submission>();
  let fileInfos = Map.empty<Text, FileInfo>();

  func toView(s : Submission) : SubmissionView {
    let fi : FileInfo = switch (fileInfos.get(s.id)) {
      case (?f) { f };
      case (null) { { epkFilename = null; trackFilenames = [] } };
    };
    {
      id = s.id;
      bandName = s.bandName;
      genre = s.genre;
      specificGenre = s.specificGenre;
      website = s.website;
      submitterName = s.submitterName;
      submitterEmail = s.submitterEmail;
      submitterRole = s.submitterRole;
      socialLinks = s.socialLinks;
      epkBlob = s.epkBlob;
      epkFilename = fi.epkFilename;
      trackBlobs = s.trackBlobs;
      trackFilenames = fi.trackFilenames;
      status = s.status;
      isArchived = s.isArchived;
      isShortlisted = s.isShortlisted;
      isFaved = s.isFaved;
      submittedAt = s.submittedAt;
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller = _ }) func submitBand(
    bandName : Text,
    genre : Text,
    specificGenre : ?Text,
    website : ?Text,
    submitterName : ?Text,
    submitterEmail : ?Text,
    submitterRole : ?Text,
    socialLinks : SocialLinks,
    epkBlob : ?Storage.ExternalBlob,
    trackBlobs : [Storage.ExternalBlob],
    epkFilename : ?Text,
    trackFilenames : [Text],
  ) : async Text {
    let id = bandName.concat(Time.now().toText());
    let submission : Submission = {
      id;
      bandName;
      genre;
      specificGenre;
      website;
      submitterName;
      submitterEmail;
      submitterRole;
      socialLinks;
      epkBlob;
      trackBlobs;
      status = #pending;
      isArchived = false;
      isShortlisted = false;
      isFaved = false;
      submittedAt = Time.now();
    };
    submissions.add(id, submission);
    fileInfos.add(id, { epkFilename; trackFilenames });
    id;
  };

  public shared ({ caller }) func updateSubmissionStatus(id : Text, status : SubmissionStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update submission status");
    };
    switch (submissions.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?submission) {
        let updatedSubmission = { submission with status };
        submissions.add(id, updatedSubmission);
      };
    };
  };

  public shared ({ caller }) func labelSubmission(id : Text, submissionLabel : SubmissionLabel, value : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can label submissions");
    };
    switch (submissions.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?submission) {
        let updatedSubmission : Submission = switch (submissionLabel) {
          case (#archived) { { submission with isArchived = value } };
          case (#shortlisted) { { submission with isShortlisted = value } };
          case (#faved) { { submission with isFaved = value } };
        };
        submissions.add(id, updatedSubmission);
      };
    };
  };

  public shared ({ caller }) func deleteSubmission(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete submissions");
    };
    if (not submissions.containsKey(id)) {
      Runtime.trap("Submission not found");
    };
    submissions.remove(id);
    fileInfos.remove(id);
  };

  public query ({ caller }) func getSubmission(id : Text) : async SubmissionView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view submissions");
    };
    switch (submissions.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?submission) { toView(submission) };
    };
  };

  public query ({ caller }) func getAllSubmissions() : async [SubmissionView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all submissions");
    };
    submissions.values().map(toView).toArray();
  };

  public query ({ caller }) func getSubmissionsByTab(tab : Tab) : async [SubmissionView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view submissions by tab");
    };

    let filtered = submissions.values().filter(
      func(s) {
        switch (tab) {
          case (#archived) { s.isArchived };
          case (#shortlisted) { s.isShortlisted };
          case (#faved) { s.isFaved };
          case (#newSubmissions) { not s.isArchived and not s.isShortlisted and not s.isFaved };
        };
      }
    );

    filtered.map(toView).toArray();
  };
};
