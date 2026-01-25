<script lang="ts">
    import {
        getFreeSlotsAt,
        bookAppointment,
        findNextPossibleDate,
        findPrevPossibleDate,
        formatTime,
    } from './io';
    import { _ } from 'svelte-i18n';
    import { DateTime } from 'luxon';

    let { mode = $bindable() } = $props();

    let selectedDate: string = $state('');
    let freeSlots: Array<number> = $state([]);
    let selectedSlot: number | null = $state(null);
    let loading: boolean = $state(false);
    let message: string = $state('');
    let navigating: boolean = $state(false);
    let booked: boolean = $state(false);

    // Set minimum date to today
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    async function handleDateChange() {
        if (!selectedDate) return;

        loading = true;
        message = '';
        selectedSlot = null;

        try {
            const date = new Date(selectedDate);
            freeSlots = await getFreeSlotsAt(date);
            if (freeSlots.length === 0) {
                message = $_('no_slots_available');
            }
        } catch (e) {
            message = $_('error_loading_slots');
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function navigateToNextDate() {
        if (navigating || loading) return;
        navigating = true;
        message = '';

        try {
            const currentDate = selectedDate
                ? new Date(selectedDate)
                : new Date();
            currentDate.setDate(currentDate.getDate() + 1); // Start from next day
            const nextDate = await findNextPossibleDate(currentDate);
            selectedDate = nextDate.toISOString().split('T')[0];
            await handleDateChange();
        } catch (e) {
            message = $_('no_slots_available');
            console.error(e);
        } finally {
            navigating = false;
        }
    }

    async function navigateToPrevDate() {
        if (navigating || loading) return;
        navigating = true;
        message = '';

        try {
            const currentDate = selectedDate
                ? new Date(selectedDate)
                : new Date();
            const prevDate = await findPrevPossibleDate(currentDate);
            selectedDate = prevDate.toISOString().split('T')[0];
            await handleDateChange();
        } catch (e) {
            message = $_('no_slots_available');
            console.error(e);
        } finally {
            navigating = false;
        }
    }

    async function handleBooking() {
        if (selectedSlot === null) {
            message = $_('please_select_slot');
            return;
        }

        loading = true;
        message = '';

        try {
            const duration = 30; // Default duration, adjust as needed
            const termin = await bookAppointment(
                new Date(selectedDate),
                selectedSlot,
                duration,
            );

            if (termin?.id) {
                message = $_('appointment_booked', {
                    values: {
                        day: DateTime.fromFormat(
                            termin.tag,
                            'yyyyMMdd',
                        ).toLocaleString(DateTime.DATE_FULL),
                        time: formatTime(parseInt(termin.beginn)),
                    },
                });
                freeSlots = [];
                selectedSlot = null;
                selectedDate = '';
                booked = true;
            } else {
                message = $_('error_booking');
            }
        } catch (e) {
            message = $_('error_booking');
            console.error(e);
        } finally {
            loading = false;
        }
    }
    function back() {
        selectedDate = '';
        freeSlots = [];
        selectedSlot = null;
        loading = false;
        message = '';
        navigating = false;
        booked = false;
        mode = 'select';
    }
</script>

<div class="card">
    {#if !booked}
        <h2>{$_('select_appointment')}</h2>

        <div class="date-selector">
            <label for="date">
                <svg
                    class="input-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    style="width: 18px; height: 18px; margin-right: 0.5rem; color: #667eea;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
                    ></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {$_('select_date')}
            </label>
            <div class="date-input-container">
                <button
                    type="button"
                    class="nav-button nav-prev"
                    onclick={navigateToPrevDate}
                    disabled={loading || navigating || !selectedDate}
                    title="Previous available date">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <input
                    type="date"
                    id="date"
                    bind:value={selectedDate}
                    onchange={handleDateChange}
                    min={minDate}
                    disabled={loading || navigating} />
                <button
                    type="button"
                    class="nav-button nav-next"
                    onclick={navigateToNextDate}
                    disabled={loading || navigating}
                    title="Next available date">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>

        {#if loading}
            <p class="loading">{$_('loading')}</p>
        {/if}
    {/if}
    {#if message}
        <p
            class="message"
            class:error={message.includes('Error') ||
                message.includes('Failed') ||
                message.includes('Fehler')}
            class:success={message.includes('successfully')}>
            {message}
        </p>
    {/if}
    {#if booked}
        <p class="info-text">
            {$_('appointment_explanation')}
        </p>
        <p class="info-text">
            {$_('ask_for_mail')}
        </p>
    {/if}

    {#if freeSlots.length > 0}
        <div class="slots-container">
            <h3>🕐 {$_('available_slots')}</h3>
            <ul class="slots-list">
                {#each freeSlots as slot}
                    <li>
                        <label>
                            <input
                                type="radio"
                                name="slot"
                                value={slot}
                                bind:group={selectedSlot} />
                            {formatTime(slot)}
                        </label>
                    </li>
                {/each}
            </ul>

            <button
                class="book-button"
                onclick={handleBooking}
                disabled={selectedSlot === null || loading}>
                ✓ {$_('book_appointment')}
            </button>
        </div>
    {/if}
    <button class="cancel-btn" onclick={back}>
        {$_('book_another')}
    </button>
</div>

<style>
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

    h2 {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1a202c;
        margin: 0 0 1.5rem 0;
        text-align: center;
    }

    .date-selector {
        margin-bottom: 2rem;
    }

    .date-selector label {
        display: flex;
        align-items: center;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
    }

    .date-input-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .nav-button {
        flex-shrink: 0;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        padding: 0;
    }

    .nav-button svg {
        width: 20px;
        height: 20px;
        color: #667eea;
    }

    .nav-button:hover:not(:disabled) {
        border-color: #667eea;
        background-color: #f7fafc;
    }

    .nav-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background-color: #f7fafc;
    }

    .date-selector input[type='date'] {
        flex: 1;
        padding: 0.875rem 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        font-size: 1rem;
        transition: all 0.2s;
        box-sizing: border-box;
        background-color: white;
    }

    .date-selector input[type='date']:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .date-selector input[type='date']:disabled {
        background-color: #f7fafc;
        cursor: not-allowed;
    }

    .loading {
        text-align: center;
        color: #667eea;
        font-weight: 500;
        padding: 1rem;
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }

    .message {
        padding: 1rem 1.25rem;
        border-radius: 10px;
        margin: 1rem 0;
        font-weight: 500;
        animation: slideDown 0.3s ease-out;
        color: black;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .message.error {
        background-color: #fed7d7;
        color: #c53030;
        border-left: 4px solid #fc8181;
    }

    .message.success {
        background-color: #c6f6d5;
        color: #22543d;
        border-left: 4px solid #48bb78;
    }

    .slots-container {
        margin-top: 2rem;
    }

    h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 1rem;
    }

    .slots-list {
        list-style: none;
        padding: 0;
        margin-bottom: 1.5rem;
        color: #091758;
        max-height: 300px;
        overflow-y: auto;
    }

    .slots-list::-webkit-scrollbar {
        width: 8px;
    }

    .slots-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }

    .slots-list::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 10px;
    }

    .slots-list::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
    }

    .slots-list li {
        margin-bottom: 0.4rem;
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .slots-list label {
        display: flex;
        align-items: center;
        padding: 0.8rem 1.25rem;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        background-color: white;
    }

    .slots-list label:hover {
        border-color: #667eea;
        background-color: #f7fafc;
        transform: translateX(4px);
    }

    .slots-list input[type='radio'] {
        width: 20px;
        height: 20px;
        margin-right: 1rem;
        cursor: pointer;
        accent-color: #667eea;
    }

    .slots-list label:has(input:checked) {
        border-color: #667eea;
        background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.1) 0%,
            rgba(118, 75, 162, 0.1) 100%
        );
        font-weight: 600;
        color: #667eea;
    }

    .book-button {
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
    }

    .book-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }

    .book-button:active:not(:disabled) {
        transform: translateY(0);
    }

    .book-button:disabled {
        background: #cbd5e0;
        cursor: not-allowed;
        box-shadow: none;
    }
</style>
