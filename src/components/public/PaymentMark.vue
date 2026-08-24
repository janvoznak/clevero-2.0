<script setup lang="ts">
/**
 * Značky platebních metod.
 *
 * Prototyp — jde o VLASTNÍ zjednodušené napodobeniny kreslené inline v SVG,
 * ne o oficiální loga (ta jsou chráněná a do prototypu se nestahují).
 * Před ostrým nasazením je nutné je vyměnit za oficiální brand assety
 * poskytovatelů (Visa/Mastercard, Apple Pay, Google Pay, Pluxee, Edenred).
 */
defineProps<{ brand: string }>()
</script>

<template>
  <span class="grid h-9 w-16 shrink-0 place-items-center border border-dov-line bg-white px-1.5">
    <!-- Karta: Mastercard kolečka + Visa -->
    <svg v-if="brand === 'card'" viewBox="0 0 64 24" class="h-5 w-full" role="img" aria-label="Visa a Mastercard">
      <circle cx="11" cy="12" r="7" fill="#EB001B" />
      <circle cx="20" cy="12" r="7" fill="#F79E1B" fill-opacity="0.85" />
      <text
        x="31" y="16.5" font-family="Inter, sans-serif" font-size="11.5" font-weight="700"
        font-style="italic" letter-spacing="-0.3" fill="#1434CB"
      >VISA</text>
    </svg>

    <!-- Apple Pay -->
    <svg v-else-if="brand === 'apple'" viewBox="0 0 64 24" class="h-5 w-full" role="img" aria-label="Apple Pay">
      <path
        d="M14.6 7.9c.5-.6.8-1.4.7-2.2-.7.03-1.6.5-2.1 1.1-.45.55-.85 1.4-.75 2.2.8.06 1.6-.4 2.15-1.1z"
        fill="#111"
      />
      <path
        d="M18.2 12.6c-.02-2 1.6-3 1.7-3.05-.93-1.35-2.37-1.53-2.88-1.55-1.23-.12-2.4.72-3.02.72-.63 0-1.58-.7-2.6-.68-1.34.02-2.57.78-3.26 1.97-1.39 2.4-.36 5.96 1 7.9.66.96 1.45 2.02 2.48 1.98 1-.04 1.38-.64 2.58-.64 1.2 0 1.54.64 2.6.62 1.07-.02 1.75-.97 2.4-1.93.76-1.1 1.07-2.17 1.09-2.23-.02-.01-2.1-.8-2.1-3.11z"
        fill="#111"
      />
      <text x="24" y="17" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#111">Pay</text>
    </svg>

    <!-- Google Pay -->
    <svg v-else-if="brand === 'google'" viewBox="0 0 64 24" class="h-5 w-full" role="img" aria-label="Google Pay">
      <defs>
        <!-- Čtyři barvy Google v pořadí modrá → červená → žlutá → zelená,
             tvrdé přechody, ať je „G" čitelné i v 17px. -->
        <linearGradient id="gpay-g" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stop-color="#4285F4" />
          <stop offset="46%" stop-color="#4285F4" />
          <stop offset="46%" stop-color="#EA4335" />
          <stop offset="66%" stop-color="#EA4335" />
          <stop offset="66%" stop-color="#FBBC05" />
          <stop offset="84%" stop-color="#FBBC05" />
          <stop offset="84%" stop-color="#34A853" />
        </linearGradient>
      </defs>
      <text x="8" y="18" font-family="Inter, sans-serif" font-size="17" font-weight="600" fill="url(#gpay-g)">G</text>
      <text x="23" y="17" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#5F6368">Pay</text>
    </svg>

    <!-- Pluxee -->
    <svg v-else-if="brand === 'pluxee'" viewBox="0 0 64 24" class="h-5 w-full" role="img" aria-label="Pluxee">
      <text x="4" y="17" font-family="Inter, sans-serif" font-size="13.5" font-weight="700" letter-spacing="-0.4" fill="#221C46">
        Plu<tspan fill="#00C389">x</tspan>ee
      </text>
    </svg>

    <!-- Edenred -->
    <svg v-else viewBox="0 0 64 24" class="h-5 w-full" role="img" aria-label="Edenred">
      <path d="M5 9.5a5 5 0 0 1 8.6-1.4" fill="none" stroke="#E2001A" stroke-width="2.4" stroke-linecap="round" />
      <text x="4" y="19" font-family="Inter, sans-serif" font-size="12" font-weight="700" letter-spacing="-0.3" fill="#12275B">
        edenred
      </text>
    </svg>
  </span>
</template>
