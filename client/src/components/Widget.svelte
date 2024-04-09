<script>
    export let text;
    export let by;
</script>

{#if by == "computer"}
    <div class="flex justify-start">
        <div
            class="bg-white/80 my-2 self outline outline-slate-500 outline-1 shadow-2xl w-[55%] rounded-xl flex"
        >
            <div
                class="w-[50px] m-2 h-[50px] border-2 rounded-full bg-white/80 shadow-md"
            ></div>
            <div class="w-[90%] bg-black/20 m-2 rounded-lg p-2">
                {text}
            </div>
        </div>
    </div>
{:else}
    <div class="flex justify-end">
        <div
            class="bg-green-200/80 my-2 outline outline-slate-500 outline-1 shadow-2xl w-[55%] rounded-xl flex"
        >
            <div
                class="w-[50px] m-2 h-[50px] border-2 rounded-full bg-white/80 shadow-md"
            >
                <b class="text-center m-auto text-base">YOU</b>
            </div>
            <div class="w-[90%] bg-black/20 m-2 rounded-lg">
                {text}
            </div>
        </div>
    </div>
{/if}
