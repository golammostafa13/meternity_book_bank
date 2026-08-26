"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The catalogue's row of filter menus, with the two dismissals a menu needs.
 *
 * `<details>` has no light-dismiss. The browser closes one only when its own
 * `<summary>` is clicked, or when a sibling in the same `name=` group is
 * opened — so a reader who opened "Stage of care" and then clicked anywhere
 * else on the page was left with the panel still spread over the spotlight,
 * and Escape did nothing either. Every other menu on the web closes on both.
 *
 * This is a wrapper, not a rewrite. It renders its children untouched, so the
 * four menus are still the server-rendered `<details>` with `<Link>` options
 * described in `catalogue-cinema`: they open, close and filter with the bundle
 * blocked or before it arrives, and hydration only adds the click-outside and
 * the Escape. Same pointerdown/keydown pair as `auth/account-menu`, including
 * putting focus back on the summary, because a keyboard reader whose menu
 * vanishes should not be left at the top of the document.
 *
 * Only the row crosses into the client. `catalogue-cinema` stays a Server
 * Component: making *it* the boundary would ship the spotlight and every face
 * of `Book3D` to the browser in order to add one listener.
 */
export function CatalogueFilterRow({
  label,
  className,
  children,
}: {
  /** Accessible name for the group, as the row carried before. */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /*
     * Read the DOM rather than track state, because the state is not ours: the
     * browser sets `open` on a `<summary>` click and nothing in React knows.
     * `[open]` is therefore the only honest source, and on a four-element
     * subtree asking for it per event costs nothing. The list is at most one
     * long in practice — the shared `name` already makes the four exclusive.
     */
    const openMenus = () =>
      root.current?.querySelectorAll<HTMLDetailsElement>("details[open]") ?? [];

    const onPointerDown = (event: PointerEvent) => {
      for (const menu of openMenus()) {
        // A press *inside* the open menu is left alone: on its own summary the
        // browser's own toggle closes it, and on an option the `<Link>` has to
        // be allowed to navigate.
        if (!menu.contains(event.target as Node)) menu.open = false;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      for (const menu of openMenus()) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={root} className={className} role="group" aria-label={label}>
      {children}
    </div>
  );
}
