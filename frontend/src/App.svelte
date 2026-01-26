<script lang="ts">
  import Appointments from './lib/Appointments.svelte';
  import Login from './lib/Login.svelte';
  import Remove from './lib/Remove.svelte';
  import Select from './lib/Select.svelte';
  import { _ } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { verifyEmailToken } from './lib/io';
  let hasAccess = false;
  let mode: 'login' | 'select' | 'book' | 'display' = 'login';
  if (window.location.pathname.startsWith('/manage/')) {
    mode = 'display';
  }
  onMount(async () => {
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

  {#if mode === 'login'}
    <Login bind:mode></Login>
  {:else if mode === 'display'}
    <Remove bind:mode />
  {:else if mode === 'book'}
    <Appointments bind:mode />
  {:else if mode === 'select'}
    <Select bind:mode />
  {/if}
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
