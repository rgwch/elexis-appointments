<script lang="ts">
    import { locale } from 'svelte-i18n';

    let { contentType = 'disclaimer' } = $props();

    let content = $state('');
    let loading = $state(true);

    $effect(() => {
        const currentLocale = $locale || 'de';
        loading = true;

        import(`../content/${contentType}.${currentLocale}.md?raw`)
            .then((module) => {
                content = module.default;
                loading = false;
            })
            .catch(() => {
                // Fallback to German if locale file doesn't exist
                import(`../content/${contentType}.de.md?raw`)
                    .then((module) => {
                        content = module.default;
                        loading = false;
                    })
                    .catch((err) => {
                        console.error(
                            `Failed to load content: ${contentType}`,
                            err,
                        );
                        content = '';
                        loading = false;
                    });
            });
    });
</script>

{#if loading}
    <div class="loading">...</div>
{:else}
    <div class="content">
        {@html content
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')}
    </div>
{/if}

<style>
    .loading {
        text-align: center;
        color: #667eea;
        padding: 1rem;
    }

    .content {
        line-height: 1.6;
        color: #2d3748;
    }

    .content :global(p) {
        margin-bottom: 1rem;
    }

    .content :global(p:last-child) {
        margin-bottom: 0;
    }
</style>
