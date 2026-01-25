<script lang="ts">
    import { _ } from 'svelte-i18n';
    let { mode = $bindable() } = $props();
</script>

<div>
    <h2>{$_('select_appointment')}</h2>
    <p>{$_('please_choose_option')}</p>
    <div class="options">
        <button class="option-btn" onclick={() => (mode = 'book')}>
            {$_('search_appointment')}
        </button>
        <button class="option-btn" onclick={() => (mode = 'display')}>
            {$_('remove_appointment')}
        </button>
    </div>
</div>
<style>
    .options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
    }

    .option-btn {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        border: none;
        border-radius: 5px;
        background-color: #5a67d8;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .option-btn:hover {
        background-color: #434190;
    }
</style>    