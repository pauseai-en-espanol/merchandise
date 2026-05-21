#!/usr/bin/env bash
#
# Full build pipeline for every design in this repo, in the order
# that respects how scripts overwrite each other's outputs.
#
#   1. build-qr.py            generates back.{,.white,.black}.svg
#                             per design folder
#   2. build-<slug>.py        per-design builders generate
#                             design.es.{white,black}.svg with the
#                             color rules that design needs
#   3. build-mockups.py       composes mockup-<color>-<side>.svg
#                             (design + tee photo) per design
#   4. qlmanage renders       rasterizes every mockup to PNG in
#                             mockups/renders/
#   5. print-export.py        outlined-text SVGs at print
#                             dimensions in prints/
#
# Stops on the first failure (set -e). Stage outputs are clearly
# labeled so a partial failure is easy to locate.
#
# Run from anywhere:
#   ./scripts/build-all.sh
#
# Skip stages with env vars:
#   SKIP_PRINT=1 ./scripts/build-all.sh    # don't run print-export
#   SKIP_RENDERS=1 ./scripts/build-all.sh  # don't rasterize mockups

set -euo pipefail

cd "$(dirname "$0")/.."

ROOT=$(pwd)
HR="------------------------------------------------------------------"

echo "$HR"
echo "Pipeline: $(date '+%Y-%m-%d %H:%M:%S')  ($ROOT)"
echo "$HR"

# --- Stage 1: QR backs ------------------------------------------------
echo
echo "[1/5] build-qr.py — back.svg + back.{white,black}.svg per design"
python3 scripts/build-qr.py

# --- Stage 2: per-design builders ------------------------------------
echo
echo "[2/5] per-design builders — design.es.{white,black}.svg"
for design_dir in designs/*/; do
    slug=$(basename "$design_dir")
    # Skip the template folder
    [[ "$slug" == _* ]] && continue
    builder="scripts/build-${slug}.py"
    if [[ -f "$builder" ]]; then
        echo "  · $slug"
        python3 "$builder"
    else
        echo "  ! $slug — no scripts/build-${slug}.py, skipping (canonical-only)"
    fi
done

# --- Stage 3: mockup SVGs --------------------------------------------
echo
echo "[3/5] build-mockups.py — mockup.{es,en}.{orange,white,black}-{front,back}.svg"
python3 scripts/build-mockups.py

# --- Stage 4: rasterize mockups --------------------------------------
if [[ "${SKIP_RENDERS:-0}" == "1" ]]; then
    echo
    echo "[4/5] qlmanage renders — SKIPPED (SKIP_RENDERS=1)"
else
    echo
    echo "[4/5] qlmanage renders — mockups/renders/<slug>/{lang}.{tee}.{side}.png"
    for design_dir in designs/*/; do
        slug=$(basename "$design_dir")
        [[ "$slug" == _* ]] && continue
        out_dir="mockups/renders/${slug}"
        mkdir -p "$out_dir"
        for lang in es en; do
            for color in orange white black; do
                for side in front back; do
                    svg="${design_dir}mockup.${lang}.${color}.${side}.svg"
                    if [[ -f "$svg" ]]; then
                        qlmanage -t -s 1500 -o "$out_dir" "$svg" \
                            >/dev/null 2>&1
                        src="${out_dir}/mockup.${lang}.${color}.${side}.svg.png"
                        dst="${out_dir}/${lang}.${color}.${side}.png"
                        if [[ -f "$src" ]]; then
                            mv "$src" "$dst"
                        fi
                    fi
                done
            done
        done
        echo "  · $slug — PNGs rendered for es + en"
    done
fi

# --- Stage 5: print export -------------------------------------------
if [[ "${SKIP_PRINT:-0}" == "1" ]]; then
    echo
    echo "[5/5] print-export.py — SKIPPED (SKIP_PRINT=1)"
else
    echo
    echo "[5/5] print-export.py — prints/<slug>-{front,back}.svg"
    python3 scripts/print-export.py
fi

echo
echo "$HR"
echo "✓ pipeline complete"
echo "$HR"
