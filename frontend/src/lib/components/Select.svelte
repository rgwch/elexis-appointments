<script lang="ts">
    import { _ } from "svelte-i18n";
    import type { user } from "../../../../types.d";
    import { logout, getUser } from "../io";
    import { onMount } from "svelte";
    let { mode = $bindable() } = $props();
    let currentUser: user | null = $state<user | null>(null);

    onMount(() => {
        currentUser = getUser();
        if (!currentUser) {
            mode = "login";
        }
    });
</script>

<div class="card">
    <p class="info-text" style="color:blue;font-weight:700;font-size:1.2rem;">{$_("welcome")}, {currentUser?.firstname} {currentUser?.lastname}</p>
    <p class="info-text">{$_("please_choose_option")}</p>
    <div class="options">
        <button class="option-btn" onclick={() => (mode = "book")}>
            {$_("search_appointment")}
        </button>
        <button class="option-btn" onclick={() => (mode = "display")}>
            {$_("remove_appointment")}
        </button>
        <button
            class="option-btn"
            style="margin-top:12px;"
            onclick={() => {
                logout();
                mode = "login";
            }}>
            {$_("logout")}
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
