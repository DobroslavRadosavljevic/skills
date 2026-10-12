// Commit probe: finds remounts and removed subtrees. Works in any React 17+ app that has a
// DevTools hook on the page (React Scan, bippy, or the React DevTools extension).
//
// Use: paste this whole file into the page (devtools console, or the "evaluate JavaScript" call of
// a browser tool). It starts at once. Then do the interaction and read the result:
//   __commitProbe.report()                    -> { commits, mounts, remounted, deletions, ... }
//   __commitProbe.start({ watch: ["Row"] })   -> start again with other options (clears the data)
//   __commitProbe.reset()                     -> clear the data, keep the options
//   __commitProbe.stop()                      -> stop recording
//
// Options (pass to start(), or set `window.__commitProbeOptions` before you paste):
//   watch      Component display names to track. Empty (default) tracks every named component.
//   ignore     Display names to skip. Use it to drop noisy library components in watch-all mode.
//   pathDepth  Named or keyed ancestors shown in each path. Default 10. The probe compares whole
//              paths, so this changes only the report text.
//   fullWalk   Walk the whole tree on each commit. Default false: the probe follows React's
//              `subtreeFlags` and visits only subtrees with a mount or a removal. Set it to true
//              if a known mount does not show.
//
// How to read the report:
//   remounted  The same path (names, keys, sibling indexes) mounted more than once. React threw
//              the old instance away, so its state, DOM, and animations started again. Causes: a
//              key that changes, a component defined inside a component, a wrapper that comes and
//              goes, or a parent that rendered nothing for one commit.
//   deletions  Removed subtrees. `parentChildrenAfter: "(none)"` means the parent rendered nothing
//              in that commit: its data was empty for a moment.
//
// Why it reads inside the commit: React keeps `fiber.deletions` only until the next render, and a
// change that lasts one commit never reaches a frame callback.
// Two siblings with the same name and the same key text give the same path, so they can show as
// "remounted". Put such names in `ignore`.
// StrictMode: the dev-only second effect pass makes no new fiber, so it does not count as a mount.
(() => {
  const PLACEMENT = 2;
  const CHILD_DELETION = 16;
  const COMPOSITE_TAGS = new Set([0, 1, 11, 14, 15]); // function, class, forwardRef, memo, simple memo

  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || typeof hook.onCommitFiberRoot !== "function") {
    return "No React DevTools hook on this page. Load React Scan (or React DevTools) before React, then paste again.";
  }
  window.__commitProbe?.stop();

  const typeName = (type) =>
    typeof type === "string"
      ? type
      : type?.displayName || type?.name || type?.render?.name || type?.type?.displayName || type?.type?.name || "";
  const isComposite = (fiber) => COMPOSITE_TAGS.has(fiber.tag);
  // Long keys keep both ends: ids often share a prefix, and serialized keys often share an end.
  const shortKey = (key) => (key.length > 32 ? `${key.slice(0, 12)}..${key.slice(-16)}` : key);
  const label = (fiber) => {
    const name = typeName(fiber.type) || `tag${fiber.tag}`;
    if (fiber.key != null) return `${name}[${shortKey(String(fiber.key))}]`;
    return fiber.index > 0 ? `${name}#${fiber.index}` : name;
  };

  let options = { watch: [], ignore: [], pathDepth: 10, fullWalk: false };
  let watch = new Set();
  let ignore = new Set();
  let active = false;
  let state;
  let seenFibers = new WeakSet();
  let seenDeletions = new WeakSet();
  let knownRoots = new WeakSet();

  const isWatched = (fiber) => {
    if (!isComposite(fiber)) return false;
    const name = typeName(fiber.type);
    if (!name || ignore.has(name)) return false;
    return watch.size === 0 || watch.has(name);
  };

  // Path from a fiber up to the root. A removed subtree has no `return` at its top, so the caller
  // passes the parent that still holds it. `id` is the whole path and identifies an instance:
  // a cut path would be the same for two instances under different pages. `text` is the cut
  // path for the report.
  const pathOf = (fiber, detachedTop, parentOfTop) => {
    const parts = [];
    let node = fiber;
    while (node && parts.length < 300) {
      if (node === fiber || isComposite(node) || node.key != null) parts.push(label(node));
      node = node === detachedTop ? parentOfTop : node.return;
    }
    return { id: parts.join("<"), text: parts.slice(0, options.pathDepth).join(" < ") };
  };

  const walk = (top, visit, limit = 200000) => {
    const stack = [top];
    for (let count = 0; stack.length > 0 && count < limit; count += 1) {
      const fiber = stack.pop();
      const goDeeper = visit(fiber);
      if (fiber !== top && fiber.sibling) stack.push(fiber.sibling);
      if (goDeeper !== false && fiber.child) stack.push(fiber.child);
    }
  };
  const markSeen = (top) =>
    walk(top, (fiber) => {
      seenFibers.add(fiber);
    });

  const recordMounts = (top, t) =>
    walk(top, (fiber) => {
      seenFibers.add(fiber);
      if (!isWatched(fiber)) return;
      state.mountCount += 1;
      const path = pathOf(fiber);
      const entry = state.mountsByPath.get(path.id) ?? { path: path.text, mounts: 0 };
      entry.mounts += 1;
      state.mountsByPath.set(path.id, entry);
      if (state.mounts.length < 500) state.mounts.push({ t, component: label(fiber), path: path.text });
    });

  const recordDeletion = (deleted, parent, t) => {
    if (seenDeletions.has(deleted)) return;
    seenDeletions.add(deleted);
    let watched = null;
    walk(
      deleted,
      (fiber) => {
        if (watched) return false;
        if (isWatched(fiber)) watched = fiber;
        return !watched;
      },
      5000,
    );
    if (!watched) return;
    state.deletionCount += 1;
    const path = pathOf(watched, deleted, parent);
    state.deletedPaths.add(path.id);
    const children = [];
    for (let child = parent.child; child; child = child.sibling) children.push(label(child));
    if (state.deletions.length >= 200) state.deletions.shift();
    state.deletions.push({
      t,
      component: label(watched),
      removedTop: label(deleted),
      path: path.text,
      parentChildrenAfter:
        children.length > 8
          ? `${children.slice(0, 8).join(", ")}, +${children.length - 8} more`
          : children.join(", ") || "(none)",
    });
  };

  const onCommit = (root) => {
    const current = root?.current;
    if (!current) return;
    state.commits += 1;
    if (!knownRoots.has(root)) {
      // First commit seen for this root: what is mounted now is the baseline, not a mount.
      knownRoots.add(root);
      markSeen(current);
      return;
    }
    const t = Math.round(performance.now());
    const canPrune = !options.fullWalk && typeof current.subtreeFlags === "number";
    walk(current, (fiber) => {
      for (const deleted of fiber.deletions ?? []) recordDeletion(deleted, fiber, t);
      if (!seenFibers.has(fiber) && !(fiber.alternate && seenFibers.has(fiber.alternate))) {
        if (fiber.alternate === null) {
          recordMounts(fiber, t);
          return false;
        }
        seenFibers.add(fiber);
      }
      return !canPrune || (fiber.subtreeFlags & (PLACEMENT | CHILD_DELETION)) !== 0;
    });
  };

  // Roots that are on the page now, found through the DOM, so the first commit after start counts.
  const baselineFromDom = () => {
    const candidates = [document.body, ...document.body.querySelectorAll("*")];
    for (let index = 0; index < candidates.length && index < 3000; index += 1) {
      const key = Object.keys(candidates[index]).find((name) => name.startsWith("__reactFiber$"));
      if (!key) continue;
      let fiber = candidates[index][key];
      while (fiber.return) fiber = fiber.return;
      const root = fiber.stateNode;
      if (root?.current && !knownRoots.has(root)) {
        knownRoots.add(root);
        markSeen(root.current);
      }
    }
  };

  const original = hook.onCommitFiberRoot;
  const wrapper = function commitProbe(rendererId, root, ...rest) {
    if (active) {
      try {
        onCommit(root);
      } catch (error) {
        state.error = String(error);
      }
    }
    return original.call(this, rendererId, root, ...rest);
  };
  hook.onCommitFiberRoot = wrapper;

  const reset = () => {
    state = {
      commits: 0,
      mountCount: 0,
      deletionCount: 0,
      mounts: [],
      deletions: [],
      mountsByPath: new Map(),
      deletedPaths: new Set(),
      error: undefined,
    };
  };

  window.__commitProbe = {
    start(next = {}) {
      options = { ...options, ...next };
      watch = new Set(options.watch);
      ignore = new Set(options.ignore);
      seenFibers = new WeakSet();
      seenDeletions = new WeakSet();
      knownRoots = new WeakSet();
      reset();
      baselineFromDom();
      active = true;
      return `Commit probe on. Watching: ${watch.size > 0 ? [...watch].join(", ") : "every named component"}`;
    },
    reset,
    stop() {
      active = false;
      // Another tool can wrap the hook after this probe. Then leave the chain as it is.
      if (hook.onCommitFiberRoot === wrapper) hook.onCommitFiberRoot = original;
    },
    report({ last = 20 } = {}) {
      const remounted = [...state.mountsByPath]
        .filter(([, entry]) => entry.mounts > 1)
        .map(([id, entry]) => ({ path: entry.path, mounts: entry.mounts, alsoRemoved: state.deletedPaths.has(id) }))
        .sort((a, b) => b.mounts - a.mounts)
        .slice(0, 50);
      return {
        active,
        commits: state.commits,
        mounts: state.mountCount,
        deletions: state.deletionCount,
        error: state.error,
        remounted,
        lastMounts: state.mounts.slice(-last),
        lastDeletions: state.deletions.slice(-last),
      };
    },
  };
  return window.__commitProbe.start(window.__commitProbeOptions ?? {});
})();
