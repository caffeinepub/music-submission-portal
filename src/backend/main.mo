import Time "mo:core/Time";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  type SocialLinks = {
    instagram : ?Text;
    spotify : ?Text;
    soundcloud : ?Text;
    youtube : ?Text;
  };

  type SubmissionStatus = {
    #pending;
    #reviewed;
    #accepted;
    #rejected;
  };

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
    submittedAt : Int.Int;
  };

  public type UserProfile = {
    name : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let submissions = Map.empty<Text, Submission>();
  let userProfiles = Map.empty<Principal, UserProfile>();

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

  public shared ({ caller }) func submitBand(bandName : Text, genre : Text, specificGenre : ?Text, website : ?Text, submitterName : ?Text, submitterEmail : ?Text, submitterRole : ?Text, socialLinks : SocialLinks, epkBlob : ?Storage.ExternalBlob, trackBlobs : [Storage.ExternalBlob]) : async Text {
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
};
