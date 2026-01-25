<script lang="ts">
    import { _ } from 'svelte-i18n';
    import { checkAccess } from './io';
    let { mode = $bindable() } = $props();
    let email: string = $state('');
    let birthdate: string = $state('');
    let errorMsg = $state('');
    let checking = $state(false);

    async function handleCheckAccess() {
        if (!email || !birthdate) {
            errorMsg = $_('please_fill_all_fields');
            return;
        }
        checking = true;
        errorMsg = '';
        let hasAccess = await checkAccess(birthdate, email);
        if (!hasAccess) {
            errorMsg = $_('access_denied');
        } else {
            mode = 'select';
        }
        checking = false;
    }
</script>

<div class="card">
    <p class="info-text">
        {$_('app_description')}
    </p>

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

    <button class="submit-btn" disabled={checking} onclick={handleCheckAccess}>
        {#if checking}
            <span class="spinner"></span>
            {$_('checking')}
        {:else}
            {$_('login')}
        {/if}
    </button>
</div>

<style>
    .info-text {
        color: #4a5568;
        text-align: center;
        line-height: 1.6;
        margin-bottom: 2rem;
        font-size: 1.1rem;
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
</style>
