<script lang="ts">
    import { findAppointments, formatTime, removeAppointment } from './io';
    import type { termin } from '../../../types.d';
    import { DateTime } from 'luxon';
    import { _ } from 'svelte-i18n';

    let selectedIds = new Set<string>();
    let appointments: termin[] = [];
    let loading = false;
    let error: string = '';

    async function loadAppointments() {
        try {
            appointments = await findAppointments();
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error';
        }
    }

    function toggleSelection(id: string) {
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
        selectedIds = selectedIds; // Trigger reactivity
    }

    async function deleteSelected() {
        loading = true;
        try {
            for (const id of selectedIds) {
                await removeAppointment(id);
            }
            selectedIds.clear();
            selectedIds = selectedIds;
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

<div>
    <h1>{$_('yourappointments')}</h1>
    {#await loadAppointments()}
        <p>{$_('loading')}</p>
    {:then}
        {#if appointments.length === 0}
            <p>{$_('noappointments')}</p>
        {:else}
            <p>{$_('select_appointments_to_remove')}</p>
            <ul style="list-style-type: none; padding-left: 0;">
                {#each appointments as appointment}
                    <li>
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedIds.has(appointment.id)}
                                on:change={() =>
                                    toggleSelection(appointment.id)}
                                disabled={loading} />
                            {DateTime.fromFormat(
                                appointment.tag,
                                'yyyyMMdd',
                            ).toLocaleString(DateTime.DATE_FULL)},
                            {formatTime(parseInt(appointment.beginn))}
                        </label>
                    </li>
                {/each}
            </ul>
            <button
                on:click={deleteSelected}
                disabled={selectedIds.size === 0 || loading}>
                {loading
                    ? $_('cancelling')
                    : selectedIds.size === 1
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
