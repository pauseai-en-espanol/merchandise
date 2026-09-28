#!/usr/bin/env python3
"""
Rebuild designs/pregunta-a-un-pollo/{es,en}.{white,black}.front.svg from the canonical
orange-tee fronts, using the standard chapter colour rule (see
scripts/tee_variants.py): body ink → white on the black tee, accent
white → orange on the white and black tees, logo swapped per tee.

Run AFTER scripts/build-qr.py (build-all.sh does this). From the repo root:
    python3 scripts/build-pregunta-a-un-pollo.py
"""
import tee_variants

if __name__ == '__main__':
    tee_variants.build('pregunta-a-un-pollo')
