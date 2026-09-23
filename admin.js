(() => {
  const cfg = window.TOKAJUDA_CONFIG || {};
  const hasConfig = cfg.supabaseUrl && !cfg.supabaseUrl.includes("COLE_")
    && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes("COLE_");

  const $ = (id) => document.getElementById(id);
  const loginView = $("loginView");
  const dashboardView = $("dashboardView");
  const list = $("adminList");

  if (!hasConfig) {
    $("loginMessage").textContent = "Configure o Supabase em config.js primeiro.";
    $("loginMessage").classList.add("error");
    return;
  }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let currentFilter = "pending";
  let rows = [];

  function escapeHtml(value = "") {
    return value.replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }

  async function isAdmin(userId) {
    const { data, error } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return !error && !!data;
  }

  async function enterDashboard(session) {
    if (!session?.user || !(await isAdmin(session.user.id))) {
      await sb.auth.signOut();
      loginView.classList.remove("hidden");
      dashboardView.classList.add("hidden");
      $("loginMessage").textContent = "Esse usuário não está autorizado como administrador.";
      $("loginMessage").className = "form-message error";
      return;
    }
    loginView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    await loadRows();
  }

  async function loadRows() {
    list.innerHTML = '<div class="empty-state">Carregando...</div>';
    const { data, error } = await sb
      .from("submissions")
      .select("id,username,referral_url,proof_path,status,created_at,approved_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      list.innerHTML = '<div class="empty-state">Erro ao carregar solicitações.</div>';
      return;
    }

    rows = data || [];
    $("statPending").textContent = rows.filter(x => x.status === "pending").length;
    $("statApproved").textContent = rows.filter(x => x.status === "approved").length;
    $("statRejected").textContent = rows.filter(x => x.status === "rejected").length;
    render();
  }

  function render() {
    const filtered = currentFilter === "all" ? rows : rows.filter(x => x.status === currentFilter);
    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state">Nenhum item nessa categoria.</div>';
      return;
    }

    list.innerHTML = filtered.map(item => `
      <article class="admin-item">
        <div class="admin-row">
          <div>
            <h3>${escapeHtml(item.username)}</h3>
            <a class="url" href="${escapeHtml(item.referral_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.referral_url)}</a>
            <div class="date">${new Date(item.created_at).toLocaleString("pt-BR")}</div>
          </div>
          <span class="status ${item.status}">${item.status}</span>
        </div>
        <div class="admin-actions">
          <button class="btn btn-ghost" data-proof="${item.id}">Ver print</button>
          <button class="btn btn-ghost" data-action="approved" data-id="${item.id}">Aprovar</button>
          <button class="btn btn-ghost" data-action="rejected" data-id="${item.id}">Recusar</button>
          <button class="btn btn-ghost danger" data-delete="${item.id}">Excluir</button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => changeStatus(btn.dataset.id, btn.dataset.action));
    });

    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.addEventListener("click", () => removeSubmission(btn.dataset.delete));
    });

    list.querySelectorAll("[data-proof]").forEach(btn => {
      btn.addEventListener("click", () => showProof(btn.dataset.proof));
    });
  }

  async function changeStatus(id, status) {
    const payload = { status };
    payload.approved_at = status === "approved" ? new Date().toISOString() : null;

    const { error } = await sb.from("submissions").update(payload).eq("id", id);
    if (error) return alert("Não foi possível alterar o status.");
    await loadRows();
  }

  async function removeSubmission(id) {
    if (!confirm("Excluir essa solicitação permanentemente?")) return;
    const item = rows.find(x => x.id === id);
    if (!item) return;

    const { error } = await sb.from("submissions").delete().eq("id", id);
    if (error) return alert("Não foi possível excluir.");

    if (item.proof_path) {
      await sb.storage.from("proofs").remove([item.proof_path]);
    }
    await loadRows();
  }

  async function showProof(id) {
    const item = rows.find(x => x.id === id);
    if (!item?.proof_path) return;

    const { data, error } = await sb.storage
      .from("proofs")
      .createSignedUrl(item.proof_path, 60);

    if (error || !data?.signedUrl) return alert("Não foi possível abrir o print.");

    $("proofImage").src = data.signedUrl;
    $("proofModal").classList.remove("hidden");
  }

  $("closeProof").addEventListener("click", () => {
    $("proofModal").classList.add("hidden");
    $("proofImage").src = "";
  });

  $("proofModal").addEventListener("click", (e) => {
    if (e.target.id === "proofModal") $("closeProof").click();
  });

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("loginMessage").textContent = "Entrando...";
    $("loginMessage").className = "form-message";

    const { data, error } = await sb.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) {
      $("loginMessage").textContent = "E-mail ou senha inválidos.";
      $("loginMessage").className = "form-message error";
      return;
    }
    await enterDashboard(data.session);
  });

  $("logoutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    location.reload();
  });

  sb.auth.getSession().then(({ data }) => {
    if (data.session) enterDashboard(data.session);
  });
})();
