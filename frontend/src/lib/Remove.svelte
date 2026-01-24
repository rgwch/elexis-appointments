<script lang="ts">
    import { findAppointments } from './io';
</script>

<div>
    {#await findAppointments() then appointments}
        {#if appointments.length === 0}
            <p>No appointments found.</p>
        {:else}
            <ul>
                {#each appointments as appointment}
                    <li>
                        Date: {appointment.date}, Start Minute: {appointment.startMinute},
                        Duration: {appointment.duration}
                    </li>
                {/each}
            </ul>
        {/if}
    {:catch error}
        <p>Error loading appointments: {error.message}</p>
    {/await}
</div>
