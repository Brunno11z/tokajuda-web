(() => {
  const cfg = window.TOKAJUDA_CONFIG || {};
  const hasConfig = cfg.supabaseUrl && !cfg.supabaseUrl.includes("COLE_")
    && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes("COLE_");

  const sb = hasConfig
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;

  const $ = (id) => document.getElementById(id);
  const form = $("submissionForm");
  const proof = $("proof");
  const fileLabel = $("fileLabel");
  const msg = $("formMessage");
  const grid = $("linksGrid");

  $("downloadBtn").href = cfg.downloadUrl || "https://www.tiktok.com/download";

  proof.addEventListener("change", () => {
    fileLabel.textContent = proof.files?.[0]?.name || "Escolher imagem";
  });

  function setMessage(text, type = "") {
    msg.className = "form-message " + type;
    msg.textContent = text;
  }

  function validTikTokUrl(value) {
    try {
      const u = new URL(value);
      const host = u.hostname.toLowerCase();
      return u.protocol === "https:" &&
        (host === "tiktok.com" || host.endsWith(".tiktok.com") || host.endsWith(".tiktokv.com"));
    } catch {
      return false;
    }
  }

  function escapeHtml(value = "") {
    return value.replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  async function loadMural() {
    if (!sb) {
      grid.innerHTML = '<div class="empty-state">Configure o Supabase em <strong>config.js</strong> para ativar o mural.</div>';
      $("approvedCount").textContent = "0";
      $("clickCount").textContent = "0";
      return;
    }

    const [{ data, error }, { count: clickCount }] = await Promise.all([
      sb.from("submissions")
        .select("id,username,referral_url,approved_at")
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(60),
      sb.from("clicks").select("*", { count: "exact", head: true })
    ]);

    if (error) {
      grid.innerHTML = '<div class="empty-state">Não foi possível carregar o mural.</div>';
      return;
    }

    $("approvedCount").textContent = data.length;
    $("clickCount").textContent = clickCount ?? "0";

    if (!data.length) {
      grid.innerHTML = '<div class="empty-state">Nenhum link aprovado ainda. Seja um dos primeiros.</div>';
      return;
    }

    grid.innerHTML = data.map(item => `
      <article class="link-card">
        <div class="link-user">${escapeHtml(item.username)}</div>
        <div class="link-meta">
          <span class="verified">✓ Aprovado</span>
          <span>${new Date(item.approved_at).toLocaleDateString("pt-BR")}</span>
        </div>
        <button class="btn btn-primary btn-full" data-open="${item.id}" data-url="${escapeHtml(item.referral_url)}">
          Abrir indicação
        </button>
      </article>
    `).join("");

    grid.querySelectorAll("[data-open]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.open;
        const url = btn.dataset.url;
        window.open(url, "_blank", "noopener,noreferrer");
        sb.from("clicks").insert({ submission_id: id }).then(() => {});
      });
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("");

    if (!sb) {
      setMessage("Configure o Supabase em config.js antes de receber envios.", "error");
      return;
    }

    const username = $("username").value.trim();
    const referralUrl = $("referralUrl").value.trim();
    const file = proof.files?.[0];

    if (username.length < 2) return setMessage("Informe seu nome ou @usuário.", "error");
    if (!validTikTokUrl(referralUrl)) {
      return setMessage("Use um link HTTPS válido do TikTok.", "error");
    }
    if (!file) return setMessage("Anexe o print da comprovação.", "error");
    if (file.size > 5 * 1024 * 1024) return setMessage("A imagem deve ter no máximo 5 MB.", "error");
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      return setMessage("Formato não permitido. Use JPG, PNG ou WEBP.", "error");
    }

    const submit = $("submitBtn");
    submit.disabled = true;
    submit.textContent = "Enviando...";

    try {
      const ext = file.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
      const proofPath = `public/${crypto.randomUUID()}.${ext || "jpg"}`;

      const { error: uploadError } = await sb.storage
        .from("proofs")
        .upload(proofPath, file, { upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;

      const { error: insertError } = await sb.from("submissions").insert({
        username,
        referral_url: referralUrl,
        proof_path: proofPath,
        status: "pending"
      });

      if (insertError) {
        await sb.storage.from("proofs").remove([proofPath]);
        throw insertError;
      }

      form.reset();
      fileLabel.textContent = "Escolher imagem";
      setMessage("Recebido! Seu link foi enviado para análise.", "success");
    } catch (err) {
      console.error(err);
      setMessage("Não foi possível enviar agora. Confira a configuração e tente novamente.", "error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Enviar para análise";
    }
  });

  loadMural();
})();
