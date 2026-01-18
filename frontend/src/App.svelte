<script lang="ts">
  import Appointments from './lib/Appointments.svelte';
  import { checkAccess } from './lib/io';
  let email: string = '';
  let birthdate: string = '';
  let hasAccess = false;
</script>

<main>
  <h1>Praxis Breite Termine</h1>
  <p>
    Die Online-Terminvergabe ist nur möglich, wenn Sie in unserem System bereits
    erfasst sind, und wenn wir auch Ihre Mailadresse haben.
  </p>
  <input
    type="email"
    placeholder="Ihre E-Mail-Adresse"
    bind:value={email}
    onblur={() => checkAccess(birthdate, email)} />
  <input
    type="text"
    placeholder="Ihr Geburtsdatum"
    bind:value={birthdate}
    onblur={async () => {
      hasAccess = await checkAccess(birthdate, email);
    }} />

  <button>Termin suchen</button>
</main>

{#if hasAccess}
  <Appointments />
{:else}
  boo
{/if}
