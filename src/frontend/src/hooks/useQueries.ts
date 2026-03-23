import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type SubmissionLabel,
  type SubmissionStatus,
  type Tab,
  UserRole,
} from "../backend";
import type { Submission } from "../backend";
import { useActor } from "./useActor";

export function useGetAllSubmissions() {
  const { actor, isFetching } = useActor();
  return useQuery<Submission[]>({
    queryKey: ["submissions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSubmissionsByTab(tab: Tab) {
  const { actor, isFetching } = useActor();
  return useQuery<Submission[]>({
    queryKey: ["submissions", "tab", tab],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSubmissionsByTab(tab);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.assignCallerUserRole(principal, UserRole.admin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
    },
  });
}

export function useLabelSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      label,
      value,
    }: { id: string; label: SubmissionLabel; value: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.labelSubmission(id, label, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

export function useUpdateSubmissionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: string; status: SubmissionStatus }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateSubmissionStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

export function useDeleteSubmission() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteSubmission(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}
