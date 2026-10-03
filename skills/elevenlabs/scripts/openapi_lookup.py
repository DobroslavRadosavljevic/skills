#!/usr/bin/env python3
"""Search the live ElevenLabs OpenAPI spec.

Usage:
  python3 openapi_lookup.py <query> [--full] [--spec PATH_OR_URL]

<query> matches (case-insensitive) the path, summary, operationId, tag, or
JS SDK method (e.g. "textToSpeech.convert", "/v1/music", "agents create").
Prints method, path, JS SDK method, summary, and with --full the query/path
params and request-body fields (name, type, enum/default, required).

Stdlib only. Caches the spec for 24h in the system temp dir.
"""
import json, os, re, sys, tempfile, time, urllib.request

SPEC_URL = "https://api.elevenlabs.io/openapi.json"
CACHE = os.path.join(tempfile.gettempdir(), "elevenlabs-openapi.json")


def load(src):
    if src and not src.startswith("http"):
        return json.load(open(src))
    url = src or SPEC_URL
    if not src and os.path.exists(CACHE) and time.time() - os.path.getmtime(CACHE) < 86400:
        return json.load(open(CACHE))
    with urllib.request.urlopen(url, timeout=60) as r:
        data = r.read()
    if not src:
        open(CACHE, "wb").write(data)
    return json.loads(data)


def camel(s):
    p = s.split("_")
    return p[0] + "".join(x[:1].upper() + x[1:] for x in p[1:])


def sdk_name(op):
    g, m = op.get("x-fern-sdk-group-name"), op.get("x-fern-sdk-method-name")
    if g is None or m is None:
        return "(REST only)"
    g = [g] if isinstance(g, str) else g
    return "client." + ".".join(camel(x) for x in g) + "." + camel(m)


def resolve(spec, node, depth=0):
    while isinstance(node, dict) and "$ref" in node and depth < 20:
        ref = node["$ref"].lstrip("#/").split("/")
        node = spec
        for k in ref:
            node = node[k]
        depth += 1
    return node


def describe(spec, schema, indent="    ", depth=0, seen=None):
    seen = seen or set()
    schema = resolve(spec, schema)
    if not isinstance(schema, dict) or depth > 3:
        return []
    for key in ("allOf",):
        if key in schema:
            out = []
            for s in schema[key]:
                out += describe(spec, s, indent, depth, seen)
            return out
    props = schema.get("properties", {})
    req = set(schema.get("required", []))
    out = []
    for name, p in props.items():
        p2 = resolve(spec, p)
        any_of = p2.get("anyOf") or p2.get("oneOf")
        if any_of:
            types = [resolve(spec, a) for a in any_of]
            t = "|".join(a.get("type", a.get("title", "obj")) for a in types)
            inner = next((a for a in types if a.get("properties")), None)
        else:
            t = p2.get("type", p2.get("title", "obj"))
            inner = p2 if p2.get("properties") else None
        if t == "array":
            it = resolve(spec, p2.get("items", {}))
            t = f"array<{it.get('type', it.get('title', 'obj'))}>"
            inner = it if it.get("properties") else None
        extra = []
        if "enum" in p2:
            extra.append("enum=" + ",".join(map(str, p2["enum"]))[:300])
        if "default" in p2 and p2["default"] is not None:
            extra.append(f"default={json.dumps(p2['default'])[:80]}")
        flag = "*" if name in req else ""
        desc = re.sub(r"\s+", " ", (p2.get("description") or ""))[:140]
        out.append(f"{indent}{name}{flag}: {t} {' '.join(extra)}  {desc}".rstrip())
        title = (inner or {}).get("title")
        if inner and title not in seen:
            out += describe(spec, inner, indent + "  ", depth + 1, seen | {title})
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    full = "--full" in sys.argv
    src = None
    if "--spec" in sys.argv:
        src = sys.argv[sys.argv.index("--spec") + 1]
        args = [a for a in args if a != src]
    if not args:
        print(__doc__)
        sys.exit(1)
    terms = " ".join(args).lower().split()
    spec = load(src)
    hits = 0
    for path, ops in spec["paths"].items():
        for method, op in ops.items():
            if method not in ("get", "post", "put", "patch", "delete"):
                continue
            sdk = sdk_name(op)
            hay = " ".join([path, op.get("summary", ""), op.get("operationId", ""),
                            " ".join(op.get("tags", [])), sdk]).lower()
            if not all(t in hay for t in terms):
                continue
            hits += 1
            dep = " [DEPRECATED]" if op.get("deprecated") else ""
            print(f"{method.upper()} {path}  ->  {sdk}  — {op.get('summary', '')}{dep}")
            if not full:
                continue
            for prm in op.get("parameters", []):
                prm = resolve(spec, prm)
                s = resolve(spec, prm.get("schema", {}))
                extra = f" enum={s['enum']}" if "enum" in s else ""
                if s.get("default") is not None:
                    extra += f" default={s['default']}"
                req = "*" if prm.get("required") else ""
                print(f"  {prm['in']}: {prm['name']}{req} {s.get('type', '')}{extra}")
            body = op.get("requestBody", {}).get("content", {})
            for ctype, c in body.items():
                print(f"  body ({ctype}):")
                print("\n".join(describe(spec, c.get("schema", {}))))
            print()
    if not hits:
        print("No match. Try fewer words, a path fragment, or an SDK group name.")


if __name__ == "__main__":
    main()
