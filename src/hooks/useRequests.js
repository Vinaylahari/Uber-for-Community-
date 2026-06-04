import { useRequestContext } from '../context/RequestContext';

export function useRequests() {
  const { memberRequests, volunteerFeed, loading, error } = useRequestContext();
  return { memberRequests, volunteerFeed, loading, error };
}
