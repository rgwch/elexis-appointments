<script lang="ts">
  import Appointments from './lib/Appointments.svelte';
  import { checkAccess } from './lib/io';
  import { _ } from 'svelte-i18n';
  let email: string = '';
  let birthdate: string = '';
  let hasAccess = false;
  let checking = false;
  let errorMsg = '';

  async function handleCheckAccess() {
    if (!email || !birthdate) {
      errorMsg = $_('please_fill_all_fields');
      return;
    }
    checking = true;
    errorMsg = '';
    hasAccess = await checkAccess(birthdate, email);
    if (!hasAccess) {
      errorMsg = $_('access_denied');
    }
    checking = false;
  }
</script>

<div class="app-container">
  {#if !hasAccess}
    <main class="login-card">
      <div class="header">
        <svg
          class="icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <h1>{$_('app_title')}</h1>
      </div>

      <p class="info-text">
        {$_('app_description')}
      </p>

      <form on:submit|preventDefault={handleCheckAccess}>
        <div class="input-group">
          <label for="email">
            <svg
              class="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2">
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              ></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            {$_('email_label')}
          </label>
          <input
            id="email"
            type="email"
            placeholder={$_('email_placeholder')}
            bind:value={email}
            disabled={checking}
            required />
        </div>

        <div class="input-group">
          <label for="birthdate">
            <svg
              class="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {$_('birthdate_label')}
          </label>
          <input
            id="birthdate"
            type="date"
            bind:value={birthdate}
            disabled={checking}
            required />
        </div>

        {#if errorMsg}
          <p class="error-msg">{errorMsg}</p>
        {/if}

        <button type="submit" class="submit-btn" disabled={checking}>
          {#if checking}
            <span class="spinner"></span>
            {$_('checking')}
          {:else}
            {$_('search_appointment')}
          {/if}
        </button>
        <div style="margin-top: 5px;">
          <p>{$_('or')}</p>
          <button
            type="button"
            class="cancel-btn"
            disabled={checking}
            on:click={() => (hasAccess = true)}>
            {$_('remove_appointment')}
          </button>
        </div>
      </form>
    </main>
  {:else}
    <Appointments />
  {/if}
</div>

<style>
  .app-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 3rem;
    max-width: 480px;
    width: 100%;
    animation: slideUp 0.4s ease-out;
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

  .icon {
    width: 64px;
    height: 64px;
    color: #667eea;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0;
    line-height: 1.2;
  }

  .info-text {
    color: #4a5568;
    text-align: center;
    line-height: 1.6;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .input-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .input-icon {
    width: 18px;
    height: 18px;
    margin-right: 0.5rem;
    color: #667eea;
  }

  input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  input:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
  }

  .error-msg {
    background-color: #fed7d7;
    color: #c53030;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    border-left: 4px solid #fc8181;
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
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

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
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

    .login-card {
      padding: 2rem 1.5rem;
    }

    h1 {
      font-size: 1.5rem;
    }
  }
</style>
