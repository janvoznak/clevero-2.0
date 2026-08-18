# Pokyny pro práci s tímto repem (paměť)

> Doplněk k závazným standardům v [`docs/STANDARDY-MODULU.md`](docs/STANDARDY-MODULU.md) — ten čti vždy jako první.

## Workflow: „commit a push" = nasazení na produkční Vercel

Pokyn **„commit a push"** (od uživatele `podpora@poski.com`) znamená **dostat změny živě na produkční Vercel**:

**https://dolnivitkovice-admin.vercel.app/**

Živá verze se auto-deployuje z větve `main`. „Commit a push" proto neznamená jen commit na feature větev — znamená celý řetězec „přes GitHub" až na produkci:

1. Commit změn na feature větev.
2. Push feature větve na `origin`.
3. Otevřít pull request z feature větve do `main`.
4. **Mergnout PR do `main`** → Vercel automaticky nasadí na produkci `dolnivitkovice-admin.vercel.app`.

> Pozn.: Vercel projekt se jmenuje `dolnivitkovice-admin` (dřív `clevero-2.0`). Primární URL adminu je `dolnivitkovice-admin.vercel.app`. Původní `clevero-20.vercel.app` je stále funkční alias (obě domény míří na stejný produkční deployment). Doména `dolnivitkovice.vercel.app` (bez `-admin`) patří jinému projektu (`dolnivitkovice-poski`, pitch „dov-pitch") — nepoužívat pro admin.

Merge do `main` je tím pádem součástí pokynu „commit a push" a spouští produkční deploy (navenek viditelná změna živého webu) — u tohoto uživatele je to očekávané chování, nemusí se na merge zvlášť doptávat.
