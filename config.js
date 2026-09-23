window.TOKAJUDA_CONFIG = {
  supabaseUrl: "https://lccqharmfmzhumemxmfb.supabase.co",
  supabaseAnonKey: "sb_publishable_7HeZB-g58gKXExjTuMsU_A_PTDI1zD7",

  // Link oficial que aparecerá no botão "Baixar TikTok Lite".
  downloadUrl: "https://www.tiktok.com/download",

  siteName: "TokAjuda"
};

// Inicializa window.supabaseClient caso algum script dependa dele
if (window.supabase && typeof window.supabase.createClient === "function") {
  window.supabaseClient = window.supabase.createClient(
    window.TOKAJUDA_CONFIG.supabaseUrl,
    window.TOKAJUDA_CONFIG.supabaseAnonKey
  );
}
