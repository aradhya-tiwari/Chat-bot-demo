<script>
    import Widget from "./Widget.svelte";
    let query = "Rieshi";
    let files = {};
    let txt = "";
    $: msg = [];

    async function chat(qry) {
        txt = "Loading...";
        let len = msg.length;
        msg[len] = { txt: qry, by: "user" };
        msg = msg;
        console.log(msg);
        const formData = new FormData();
        // let dta = await files[0].text();
        // console.log("Data" + dta);
        formData.append("query", query);
        formData.append("filess", files[0]);
        // console.log(files[0].name);
        let fetchh = await fetch("http://localhost:3001/chat", {
            method: "POST",

            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });
        let streamm = fetchh.body;
        const reader = streamm.getReader();
        txt = "";
        len++;
        const readChunk = () => {
            // Read a chunk from the reader
            reader
                .read()
                .then(({ value, done }) => {
                    // Check if the stream is done
                    if (done) {
                        // Log a message
                        console.log("Stream finished");
                        // Return from the function
                        return;
                    }
                    // Convert the chunk value to a string
                    const chunkString = new TextDecoder().decode(value);
                    // Log the chunk string
                    txt += chunkString;
                    msg[len] = { txt: txt, by: "computer" };
                    msg = msg;
                    // Read the next chunk
                    readChunk();
                })
                .catch((error) => {
                    // Log the error
                    console.error(error);
                });
        };
        // Start reading the first chunk
        readChunk();
        // onMount(() => {});
    }
</script>

<svelte:head>
    <link
        href="https://fonts.googleapis.com/css?family=Montserrat"
        rel="stylesheet"
    />
</svelte:head>
<div class="w-full h-screen md:py-[5vh] relative">
    <div
        class="w-full h-full md:h-[90vh] md:w-4/5 m-auto p-10 rounded-3xl shadow-xl relative bg-slate-300"
    >
        <h1 class=" font-bold mb-3 text text-3xl text-blue-700">
            Ayu<span class="text-green-700">RecommenD</span>
        </h1>
        <div
            class=" overflow-y-scroll w-full p-5 bg-slate-400 rounded-2xl h-[85%] shadow-lg"
        >
            {#each msg as m}
                <Widget text={m.txt} by={m.by} />
            {/each}

            <span class="text-black font-bold">|</span>
        </div>
        <div
            class=" relative justify-between flex top-2 w-full border border-green-500"
        >
            <input
                type="text"
                name=""
                id="srch-box"
                placeholder="Search for pricing"
                class=" text-base font-medium shadow-md rounded-md p-1 w-full h-[5vh] focus:outline-none focus:border-2 border-black rounded-e-none"
                bind:value={query}
            />
            <!-- <input type="file" name="file" id="" bind:files /> -->
            <button
                type="submit"
                class=" bg-black h-[5vh] hover:scale-x-110 transition-all text-white px-10 rounded-lg focus:outline-none rounded-s-none"
                on:click={() => chat(query)}>Chat</button
            >
        </div>
    </div>
</div>

<!-- {#await file.text() then text}
        <p>e: {text} i: {i}</p>
    {/await} -->

<style>
</style>
