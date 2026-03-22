import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface SocialLinks {
    soundcloud?: string;
    instagram?: string;
    spotify?: string;
    youtube?: string;
}
export interface Submission {
    id: string;
    status: SubmissionStatus;
    submitterName?: string;
    submitterRole?: string;
    socialLinks: SocialLinks;
    submittedAt: Int;
    specificGenre?: string;
    bandName: string;
    website?: string;
    genre: string;
    submitterEmail?: string;
    trackBlobs: Array<ExternalBlob>;
    epkBlob?: ExternalBlob;
}
export type Int = bigint;
export interface UserProfile {
    name: string;
}
export enum SubmissionStatus {
    pending = "pending",
    rejected = "rejected",
    reviewed = "reviewed",
    accepted = "accepted"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteSubmission(id: string): Promise<void>;
    getAllSubmissions(): Promise<Array<Submission>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSubmission(id: string): Promise<Submission>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitBand(bandName: string, genre: string, specificGenre: string | null, website: string | null, submitterName: string | null, submitterEmail: string | null, submitterRole: string | null, socialLinks: SocialLinks, epkBlob: ExternalBlob | null, trackBlobs: Array<ExternalBlob>): Promise<string>;
    updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void>;
}
