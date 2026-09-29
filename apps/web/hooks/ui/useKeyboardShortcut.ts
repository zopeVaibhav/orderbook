'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

export type ShortcutHandler = (event: KeyboardEvent) => void;

export type ShortcutOptions = {
    enabled?: boolean;
    allowInInput?: boolean;
    preventDefault?: boolean;
    repeat?: boolean;
};

type Registration = {
    handlerRef: { current: ShortcutHandler };
    allowInInput: boolean | undefined;
    preventDefault: boolean;
    repeat: boolean;
};

const MODIFIER_ORDER = ['meta', 'ctrl', 'alt', 'shift'] as const;

const MODIFIER_ALIASES: Record<string, (typeof MODIFIER_ORDER)[number]> = {
    cmd: 'meta',
    command: 'meta',
    meta: 'meta',
    control: 'ctrl',
    ctrl: 'ctrl',
    alt: 'alt',
    option: 'alt',
    opt: 'alt',
    shift: 'shift',
};

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

let applePlatform: boolean | null = null;

export function isApplePlatform(): boolean {
    if (typeof navigator === 'undefined') return true;
    if (applePlatform === null) {
        applePlatform = /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
    }
    return applePlatform;
}

function subscribeToPlatform(): () => void {
    return () => {};
}

export function useIsApplePlatform(): boolean {
    return useSyncExternalStore(subscribeToPlatform, isApplePlatform, () => true);
}

export function normalizeCombo(combo: string): string | null {
    const parts = combo
        .toLowerCase()
        .split('+')
        .map((part) => part.trim())
        .filter(Boolean);

    const key = parts.pop();
    if (!key) return null;

    const modifiers = new Set<(typeof MODIFIER_ORDER)[number]>();

    for (const part of parts) {
        if (part === 'mod') {
            modifiers.add(isApplePlatform() ? 'meta' : 'ctrl');
            continue;
        }

        const modifier = MODIFIER_ALIASES[part];
        if (!modifier) return null;
        modifiers.add(modifier);
    }

    return [...MODIFIER_ORDER.filter((m) => modifiers.has(m)), key].join('+');
}

function eventCombo(event: KeyboardEvent): string {
    const modifiers: string[] = [];
    if (event.metaKey) modifiers.push('meta');
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    return [...modifiers, event.key.toLowerCase()].join('+');
}

function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

const registry = new Map<string, Set<Registration>>();
let listening = false;

function onKeyDown(event: KeyboardEvent): void {
    const matched = registry.get(eventCombo(event));
    if (!matched?.size) return;

    const editable = isEditable(event.target);
    const bare = !event.metaKey && !event.ctrlKey && !event.altKey;

    for (const registration of [...matched]) {
        if (event.repeat && !registration.repeat) continue;
        if (editable && !(registration.allowInInput ?? !bare)) continue;

        if (registration.preventDefault) event.preventDefault();
        registration.handlerRef.current(event);
    }
}

function register(combo: string, registration: Registration): () => void {
    let bucket = registry.get(combo);
    if (!bucket) {
        bucket = new Set();
        registry.set(combo, bucket);
    }
    bucket.add(registration);

    if (!listening) {
        document.addEventListener('keydown', onKeyDown);
        listening = true;
    }

    return () => {
        bucket.delete(registration);
        if (bucket.size === 0) registry.delete(combo);

        if (registry.size === 0 && listening) {
            document.removeEventListener('keydown', onKeyDown);
            listening = false;
        }
    };
}

export function useKeyboardShortcut(
    combo: string | string[],
    handler: ShortcutHandler,
    options: ShortcutOptions = {},
): void {
    const { enabled = true, allowInInput, preventDefault = true, repeat = false } = options;

    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    });

    const combos = (Array.isArray(combo) ? combo : [combo]).join(' ');

    useEffect(() => {
        if (!enabled) return;

        const registration: Registration = {
            handlerRef,
            allowInInput,
            preventDefault,
            repeat,
        };

        const unregister = combos
            .split(' ')
            .map(normalizeCombo)
            .filter((c): c is string => c !== null)
            .map((c) => register(c, registration));

        return () => unregister.forEach((off) => off());
    }, [combos, enabled, allowInInput, preventDefault, repeat]);
}
