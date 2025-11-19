// hooks/useReverseGeocode.ts
import { useEffect, useRef, useState } from 'react';

export type ReverseGeoResult = {
    display_name: string;
    cached?: boolean;
    components?: Record<string, unknown> | null;
    found?: boolean;
    error?: string | null;
};

type State = {
    loading: boolean;
    result: ReverseGeoResult | null;
    status: number; // HTTP status or 0 on network error
    error?: unknown;
};

const cache = new Map<string, ReverseGeoResult>();

function keyFor(lat: number, lon: number) {
    // normalized to 6 decimals to match backend
    return `${lat.toFixed(6)}|${lon.toFixed(6)}`;
}

/**
 * useReverseGeocode
 * - lat/lon may be undefined
 * - debounceMs — milliseconds to debounce lookups (useful while dragging markers)
 */
export function useReverseGeocode(
    lat?: number | null,
    lon?: number | null,
    debounceMs = 300
) {
    const [state, setState] = useState<State>({ loading: false, result: null, status: 0 });
    const timer = useRef<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // cleanup on unmount
        return () => {
            if (timer.current) window.clearTimeout(timer.current);
            abortRef.current?.abort();
        };
    }, []);

    const refresh = async (force = false) => {
        if (lat == null || lon == null) {
            setState({ loading: false, result: null, status: 0 });
            return;
        }

        const k = keyFor(lat, lon);
        if (!force && cache.has(k)) {
            setState({ loading: false, result: cache.get(k) ?? null, status: 200 });
            return;
        }

        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;

        setState(prev => ({ ...prev, loading: true }));

        const base = process.env.NEXT_PUBLIC_API_URL ?? '';
        const url = `${base}/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}${force ? '&force=1' : ''}`;

        try {
            const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ac.signal });
            const status = res.status;
            const text = await res.text();

            type FetchJson = {
                display_name?: string;
                cached?: boolean;
                components?: Record<string, unknown> | null;
                found?: boolean;
                error?: string | null;
            };

            function isFetchJson(obj: unknown): obj is FetchJson {
                if (!obj || typeof obj !== 'object') return false;
                const o = obj as Record<string, unknown>;
                if ('display_name' in o && o.display_name != null && typeof o.display_name !== 'string') return false;
                if ('cached' in o && o.cached != null && typeof o.cached !== 'boolean') return false;
                if ('components' in o && o.components != null && typeof o.components !== 'object') return false;
                if ('found' in o && o.found != null && typeof o.found !== 'boolean') return false;
                if ('error' in o && o.error != null && typeof o.error !== 'string' && o.error !== null) return false;
                return true;
            }

            let json: unknown = null;
            try { json = text ? JSON.parse(text) : null; } catch { json = null; }

            if (res.ok && isFetchJson(json) && json.display_name) {
                const out: ReverseGeoResult = {
                    display_name: json.display_name,
                    cached: !!json.cached,
                    components: json.components ?? null,
                    found: json.found ?? true,
                    error: null,
                };
                cache.set(k, out);
                setState({ loading: false, result: out, status });
                return;
            }

            // handle non-ok but JSON responses that include display_name
            if (isFetchJson(json) && typeof json.display_name === 'string') {
                const out: ReverseGeoResult = {
                    display_name: json.display_name,
                    cached: !!json.cached,
                    components: json.components ?? null,
                    found: json.found ?? false,
                    error: json.error ?? null,
                };
                // only cache if found===true (avoid storing fallbacks)
                if (out.found) cache.set(k, out);
                setState({ loading: false, result: out, status });
                return;
            }

            // fallback: coords string
            const fallback: ReverseGeoResult = {
                display_name: `(${lat.toFixed(5)}, ${lon.toFixed(5)})`,
                cached: false,
                components: null,
                found: false,
                error: isFetchJson(json) ? json.error ?? `Status ${status}` : `Status ${status}`,
            };
            setState({ loading: false, result: fallback, status, error: isFetchJson(json) ? json.error ?? null : null });
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            const fallback: ReverseGeoResult = { display_name: `(${lat.toFixed(5)}, ${lon.toFixed(5)})`, cached: false, components: null, found: false, error: String(err) };
            setState({ loading: false, result: fallback, status: 0, error: err });
        }
    };

    // debounced auto-refresh when lat/lon change
    useEffect(() => {
        if (timer.current) window.clearTimeout(timer.current);
        abortRef.current?.abort();

        if (lat == null || lon == null) {
            setState({ loading: false, result: null, status: 0 });
            return;
        }

        setState(prev => ({ ...prev, loading: true }));
        timer.current = window.setTimeout(() => {
            refresh(false);
            timer.current = null;
        }, debounceMs);

        return () => {
            if (timer.current) window.clearTimeout(timer.current);
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lat?.toFixed?.(6), lon?.toFixed?.(6), debounceMs]);

    return {
        loading: state.loading,
        result: state.result,
        status: state.status,
        refresh,
        cacheKey: lat != null && lon != null ? keyFor(lat, lon) : null,
    };
}
