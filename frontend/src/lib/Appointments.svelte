<script lang="ts">
    import { getFreeSlotsAt, bookAppointment } from './io';
    import { _ } from 'svelte-i18n';

    let selectedDate: string = '';
    let freeSlots: Array<number> = [];
    let selectedSlot: number | null = null;
    let loading: boolean = false;
    let message: string = '';

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

    function formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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
            const success = await bookAppointment(selectedSlot, duration);

            if (success) {
                message = $_('appointment_booked');
                freeSlots = [];
                selectedSlot = null;
                selectedDate = '';
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
</script>

<div class="appointments-container">
    <h2>📅 {$_('select_appointment')}</h2>

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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {$_('select_date')}
        </label>
        <input
            type="date"
            id="date"
            bind:value={selectedDate}
            on:change={handleDateChange}
            disabled={loading} />
    </div>

    {#if loading}
        <p class="loading">{$_('loading')}</p>
    {/if}

    {#if message}
        <p
            class="message"
            class:error={message.includes('Error') ||
                message.includes('Failed')}
            class:success={message.includes('successfully')}>
            {message}
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
                on:click={handleBooking}
                disabled={selectedSlot === null || loading}>
                ✓ {$_('book_appointment')}
            </button>
        </div>
    {/if}
</div>

<style>
    .appointments-container {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 3rem;
        max-width: 600px;
        margin: 0 auto;
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

    .date-selector input[type='date'] {
        width: 100%;
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
        margin-bottom: 0.75rem;
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
        padding: 1rem 1.25rem;
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

    @media (max-width: 640px) {
        .appointments-container {
            padding: 2rem 1.5rem;
        }

        h2 {
            font-size: 1.5rem;
        }
    }
</style>
