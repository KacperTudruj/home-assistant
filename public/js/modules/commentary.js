export function initCommentary() {
    const FEATURE_KEY = window.FEATURE_KEY || "app";
    
    // Render HTML if not present
    let commentaryHeader = document.querySelector('header.commentary');
    if (!commentaryHeader) {
        commentaryHeader = document.createElement('header');
        commentaryHeader.className = 'commentary';
        commentaryHeader.innerHTML = `
            <div class="commentary-line">
                <select id="commentator-select"></select>
                <span class="colon">:</span>
                <span id="commentary-text">Ładowanie komentarza…</span>
            </div>
        `;
        document.body.prepend(commentaryHeader);
    }

    const commentaryEl = document.getElementById("commentary-text");
    const commentatorSelect = document.getElementById("commentator-select");

    if (commentaryEl && commentatorSelect) {
        // ====== LOAD COMMENTATORS ======
        fetch("/api/commentators")
            .then(res => res.json())
            .then(commentators => {
                commentatorSelect.innerHTML = ""; // Clear if anything was there
                commentators.forEach(c => {
                    const option = document.createElement("option");
                    option.value = c.id;
                    option.textContent = c.name;
                    commentatorSelect.appendChild(option);
                });

                const saved = localStorage.getItem("commentatorId");
                if (saved) {
                    commentatorSelect.value = saved;
                    loadCommentary(saved, commentaryEl, FEATURE_KEY);
                } else if (commentators.length > 0) {
                    const firstId = commentators[0].id;
                    commentatorSelect.value = firstId;
                    loadCommentary(firstId, commentaryEl, FEATURE_KEY);
                }
            })
            .catch(err => {
                console.error("Błąd ładowania komentatorów", err);
            });

        // ====== CHANGE COMMENTATOR ======
        commentatorSelect.addEventListener("change", () => {
            const id = commentatorSelect.value;
            if (!id) return;

            localStorage.setItem("commentatorId", id);
            loadCommentary(id, commentaryEl, FEATURE_KEY);
        });
    }
}

function loadCommentary(commentatorId, commentaryEl, featureKey) {
    if (!commentaryEl) return;
    
    commentaryEl.innerText = "🗣️ Myślę…";

    fetch(`/api/commentary?feature=${featureKey}&commentatorId=${commentatorId}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            commentaryEl.innerText = data.text;
        })
        .catch(() => {
            commentaryEl.innerText = "🤐 Komentator dziś milczy...";
        });
}
