<script>
    let query = "";
    let txt = {};
    async function chat() {
        console.log(query);
        let fetchh = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",
            },
            body: JSON.stringify({
                query: query,
            }),
        });

        let etchh = await fetchh.json();
        console.log(etchh, query);
        txt = etchh;
    }
</script>

<div class="w-10 h-10 bg-black">000</div>
<input type="" name="query" id="" bind:value={query} />
<input type="submit" value="Submit" on:click={() => chat()} />
{txt.answer || ""}
