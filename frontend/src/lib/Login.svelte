<script lang="ts">
    import { _ } from 'svelte-i18n';
    import { checkAccess } from './io';
    import LocalizedContent from './LocalizedContent.svelte';
    let { mode = $bindable() } = $props();
    let email: string = $state('');
    let birthdate: string = $state('');
    let errorMsg = $state('');
    let checking = $state(false);
    let showModal = $state(false);

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

    <div class="info-link-container">
        <button class="info-link" onclick={() => showModal = true}>
            {$_('more_information')}
        </button>
    </div>
</div>

{#if showModal}
    <div class="modal-overlay" onclick={() => showModal = false}>
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h2>{$_('more_information')}</h2>
                <button class="modal-close" onclick={() => showModal = false}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <LocalizedContent contentType="disclaimer" />
            </div>
        </div>
    </div>
{/if}

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

    .info-link-container {
        text-align: center;
        margin-top: 1rem;
    }

    .info-link {
        background: none;
        border: none;
        color: #667eea;
        text-decoration: underline;
        cursor: pointer;
        font-size: 0.9rem;
        padding: 0.5rem;
        transition: color 0.2s;
    }

    .info-link:hover {
        color: #5a67d8;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #2d3748;
    }

    .modal-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: background-color 0.2s;
    }

    .modal-close:hover {
        background-color: #f7fafc;
    }

    .modal-close svg {
        width: 24px;
        height: 24px;
        color: #4a5568;
    }

    .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
    }
</style>
