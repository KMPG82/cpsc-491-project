import { useCallback, useEffect, useRef, useState } from 'react';

import type { Location } from '@/types/location';
import { searchAddresses, type AddressSearchOptions } from '@/utilities/geoapify';

export function useAddressAutocomplete(
  { proximity }: Pick<AddressSearchOptions, 'proximity'> = {},
) {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const version = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Invalidate immediately on edits/selection, before effect cleanup runs.
  const cancel = useCallback(() => {
    version.current += 1;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    controller.current?.abort();
    controller.current = null;
  }, []);

  const onChangeText = useCallback((value: string) => {
    cancel();
    setText(value);
    setSelectedLocation(null);
    setSuggestions([]);
    setError(null);
    setHasSearched(false);
    setLoading(!!value.trim());
  }, [cancel]);

  const selectSuggestion = useCallback((location: Location) => {
    cancel();
    setSelectedLocation(location);
    setText(location.formattedAddress);
    setSuggestions([]);
    setLoading(false);
    setError(null);
    setHasSearched(false);
  }, [cancel]);

  const latitude = proximity?.latitude;
  const longitude = proximity?.longitude;
  useEffect(() => {
    cancel();
    if (!text.trim() || selectedLocation) return;
    const requestVersion = version.current;
    const requestController = new AbortController();
    controller.current = requestController;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setHasSearched(false);
    timer.current = setTimeout(async () => {
      timer.current = null;
      try {
        const results = await searchAddresses(text, {
          signal: requestController.signal,
          proximity: latitude !== undefined && longitude !== undefined
            ? { latitude, longitude } : undefined,
        });
        if (requestVersion !== version.current || requestController.signal.aborted) return;
        setSuggestions(results.slice(0, 5));
        setHasSearched(true);
      } catch (cause) {
        if (requestVersion !== version.current || requestController.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Address search failed. Please try again.');
      } finally {
        if (requestVersion === version.current && !requestController.signal.aborted) {
          setLoading(false);
        }
      }
    }, 500);
    return cancel;
  }, [text, selectedLocation, latitude, longitude, cancel]);

  // Also covers unmounts when the search effect has no active request.
  useEffect(() => cancel, [cancel]);

  return { text, onChangeText, suggestions, selectedLocation, selectSuggestion, loading, error, hasSearched };
}

export type AddressAutocompleteState = ReturnType<typeof useAddressAutocomplete>;
