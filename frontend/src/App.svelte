<script lang="ts">
  import Appointments from './lib/components/Appointments.svelte';
  import Login from './lib/components/Login.svelte';
  import Remove from './lib/components/Remove.svelte';
  import Select from './lib/components/Select.svelte';
  import { _, locale } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { verifyEmailToken, checkHealth } from './lib/io';
  let hasAccess = false;
  let mode: 'login' | 'select' | 'book' | 'display' = 'login';
  let systemAvailable = true;
  let checkingHealth = true;
  if (window.location.pathname.startsWith('/manage/')) {
    mode = 'display';
  }
  onMount(async () => {
    // Check system health first
    systemAvailable = await checkHealth();
    checkingHealth = false;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      const success = await verifyEmailToken(token);
      if (success) {
        // Set your app state to logged in
        mode = 'display';
        // Clear token from URL
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // Handle invalid token
      }
    }
  });
</script>

<div class="app-container">
  <div class="header">
    <h1>{$_('app_title')}</h1>
  </div>

  {#if checkingHealth}
    <div class="info-message">
      <p>{$_('checking')}</p>
    </div>
  {:else if !systemAvailable}
    <div class="error-message">
      <h2>{$_('system_unavailable')}</h2>
      <p>{$_('system_unavailable_message')}</p>
    </div>
  {:else if mode === 'login'}
    <Login bind:mode></Login>
  {:else if mode === 'display'}
    <Remove bind:mode />
  {:else if mode === 'book'}
    <Appointments bind:mode />
  {:else if mode === 'select'}
    <Select bind:mode />
  {/if}
  <div>
    <button onclick={() => ($locale = 'de')}>DE</button>
    <button onclick={() => ($locale = 'en')}>EN</button>
    <button onclick={() => ($locale = 'fr')}>FR</button>
    <button onclick={() => ($locale = 'it')}>IT</button>
    <button onclick={() => ($locale = 'pt')}>PT</button>
    <button onclick={() => ($locale = 'ru')}>RU</button>
    <button onclick={() => ($locale = 'sr')}>SR</button>
    <button onclick={() => ($locale = 'ta')}>TA</button>
  </div>
</div>

<style>
  .app-container {
    /*min-height: 100vh; */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    max-width: 800px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .error-message {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
  }

  .error-message h2 {
    color: #ffcc00;
    margin-bottom: 1rem;
  }

  .info-message {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .cancel-btn {
    background: #ea66ac;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    gap: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .app-container {
      padding: 1rem;
    }
  }
</style>
