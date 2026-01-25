<script lang="ts">
    import { findAppointments, formatTime, removeAppointment } from './io';
    import type { termin } from '../../../types.d';
    import { DateTime } from 'luxon';
    import { _ } from 'svelte-i18n';
    let { mode = $bindable() } = $props();

    let selectedIds: Set<string> = $state(new Set<string>());
    let appointments: termin[] = $state([]);
    let loading = $state(false);
    let error: string = $state('');

    function back() {
        selectedIds = new Set(); // Create new Set to trigger reactivity
        loading = false;
        error = '';
        appointments = [];
        mode = 'select';
    }
    async function loadAppointments() {
        try {
            appointments = await findAppointments();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error';
        }
    }

    function toggleSelection(id: string) {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        selectedIds = newSet; // Create new Set to trigger reactivity
    }

    function isFutureAppointment(appointment: termin): boolean {
        const appointmentDateTime = DateTime.fromFormat(
            appointment.tag,
            'yyyyMMdd',
        ).plus({ minutes: parseInt(appointment.beginn) });
        return appointmentDateTime > DateTime.now();
    }

    async function deleteSelected() {
        loading = true;
        try {
            for (const id of selectedIds) {
                await removeAppointment(id);
            }
            selectedIds = new Set(); // Create new Set to trigger reactivity
            await loadAppointments();
        } catch (e) {
            error =
                e instanceof Error
                    ? e.message
                    : $_('error_deleting_appointments');
        } finally {
            loading = false;
        }
    }
</script>

<div class="card">
    <h1>{$_('yourappointments')}</h1>
    {#await loadAppointments()}
        <p>{$_('loading')}</p>
    {:then}
        {#if appointments.length === 0}
            <p class="info-text">{$_('noappointments')}</p>
        {:else}
            <p>{$_('select_appointments_to_remove')}</p>
            <ul class="slots-list">
                {#each appointments as appointment}
                    <li>
                        <label>
                            {#if isFutureAppointment(appointment)}
                                <input
                                    style="margin-right: 0.5rem;"
                                    type="checkbox"
                                    checked={selectedIds.has(appointment.id)}
                                    onclick={() =>
                                        toggleSelection(appointment.id)}
                                    disabled={loading} />
                            {/if}
                            {DateTime.fromFormat(
                                appointment.tag,
                                'yyyyMMdd',
                            ).toLocaleString(DateTime.DATE_FULL)},
                            {formatTime(parseInt(appointment.beginn))}
                        </label>
                    </li>
                {/each}
            </ul>
            <button onclick={deleteSelected} disabled={selectedIds.size === 0}>
                {selectedIds.size === 1
                    ? $_('remove_selected_appointment')
                    : $_('remove_selected_appointments', {
                          values: { number: selectedIds.size },
                      })}
            </button>
        {/if}
        {#if error}
            <p style="color: red;">Error: {error}</p>
        {/if}
    {/await}
</div>
<div>
    <button class="cancel-btn" onclick={back}>
        {$_('back_to_menu')}
    </button>
</div>
