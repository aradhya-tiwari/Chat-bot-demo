<script lang="ts">
    let docContent = "";
    let files;
    async function train() {
        let reader = new FileReader();
        let formData = new FormData();
        let dta = await files[0].text();
        console.log(dta);
        formData.append("files", files[0]);
        let fetchh = await fetch("http://localhost:3000/chat_gemini/train", {
            method: "POST",
            headers: {
                // "Content-Type": "multipart/form-data",
            },
            body: formData,
        });
    }
</script>

<div>
    <input type="file" name="file" id="" bind:files />
    <button type="submit" value="Submit" on:click={() => train()}>Submit</button
    >
</div>
