<script>
    let query = "cloudflare d1";
    let files = {};
    let txt = "";
    async function chat() {
        txt = "Loading...";
        const formData = new FormData();
        // let dta = await files[0].text();
        // console.log("Data" + dta);
        formData.append("query", query);
        formData.append("filess", files[0]);
        // console.log(files[0].name);

        let fetchh = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });
        let streamm = fetchh.body;
        const reader = streamm.getReader();
        txt = "";
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
        <h1 class=" font-extrabold mb-3">Actionable.ai</h1>
        <div
            class=" overflow-y-scroll w-full p-5 text-xs text-gray-600 bg-slate-100 rounded-2xl h-[85%] shadow-lg"
        >
            {txt}
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
                class=" text-sm shadow-md rounded-md p-1 w-full h-[5vh] focus:outline-none focus:border-2 border-black rounded-e-none"
                bind:value={query}
            />
            <!-- <input type="file" name="file" id="" bind:files /> -->
            <button
                type="submit"
                class=" bg-black h-[5vh] hover:scale-x-110 transition-all text-white px-2 rounded-lg focus:outline-none rounded-s-none"
                on:click={chat}>Chat</button
            >
        </div>
    </div>
</div>

<!-- {#await file.text() then text}
        <p>e: {text} i: {i}</p>
    {/await} -->

<style>
</style>
