import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
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

  public type Submission = {
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

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let submissions = Map.empty<Text, Submission>();

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

  public shared ({ caller }) func submitBand(
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
  };

  public query ({ caller }) func getSubmission(id : Text) : async Submission {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view submissions");
    };
    switch (submissions.get(id)) {
      case (null) { Runtime.trap("Submission not found") };
      case (?submission) { submission };
    };
  };

  public query ({ caller }) func getAllSubmissions() : async [Submission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all submissions");
    };
    submissions.values().toArray();
  };

  public query ({ caller }) func getSubmissionsByTab(tab : Tab) : async [Submission] {
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

    filtered.toArray();
  };
};
