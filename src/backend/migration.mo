import Map "mo:core/Map";
import Storage "blob-storage/Storage";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

module {
  type OldSocialLinks = {
    instagram : ?Text;
    facebook : ?Text;
    spotify : ?Text;
    soundcloud : ?Text;
    twitter : ?Text;
  };

  type OldSubmissionStatus = {
    #pending;
    #reviewed;
    #accepted;
    #rejected;
  };

  type OldSubmission = {
    id : Text;
    bandName : Text;
    bio : Text;
    website : Text;
    socialLinks : OldSocialLinks;
    epkBlob : ?Storage.ExternalBlob;
    trackBlobs : [Storage.ExternalBlob];
    status : OldSubmissionStatus;
    submittedAt : Int.Int;
  };

  type OldUserProfile = {
    name : Text;
  };

  type OldActor = {
    submissions : Map.Map<Text, OldSubmission>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewSocialLinks = {
    instagram : ?Text;
    spotify : ?Text;
    soundcloud : ?Text;
    youtube : ?Text;
  };

  type NewSubmissionStatus = {
    #pending;
    #reviewed;
    #accepted;
    #rejected;
  };

  type NewSubmission = {
    id : Text;
    bandName : Text;
    genre : Text;
    specificGenre : ?Text;
    website : ?Text;
    submitterName : ?Text;
    submitterEmail : ?Text;
    submitterRole : ?Text;
    socialLinks : NewSocialLinks;
    epkBlob : ?Storage.ExternalBlob;
    trackBlobs : [Storage.ExternalBlob];
    status : NewSubmissionStatus;
    submittedAt : Int.Int;
  };

  type NewUserProfile = {
    name : Text;
  };

  type NewActor = {
    submissions : Map.Map<Text, NewSubmission>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newSubmissions = old.submissions.map<Text, OldSubmission, NewSubmission>(
      func(_id, oldSubmission) {
        {
          id = oldSubmission.id;
          bandName = oldSubmission.bandName;
          genre = "Unknown";
          specificGenre = null;
          website = ?oldSubmission.website;
          submitterName = null;
          submitterEmail = null;
          submitterRole = null;
          socialLinks = {
            instagram = oldSubmission.socialLinks.instagram;
            spotify = oldSubmission.socialLinks.spotify;
            soundcloud = oldSubmission.socialLinks.soundcloud;
            youtube = null;
          };
          epkBlob = oldSubmission.epkBlob;
          trackBlobs = oldSubmission.trackBlobs;
          status = oldSubmission.status;
          submittedAt = oldSubmission.submittedAt;
        };
      }
    );
    {
      submissions = newSubmissions;
      userProfiles = old.userProfiles;
    };
  };
};
