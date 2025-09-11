<?php
// send.php — handler do formulário de contacto (JSON ou form-encoded)

// ---------- CORS (ajusta o domínio em produção) ----------
header('Access-Control-Allow-Origin: *'); // em produção, usa: https://www.vt.co.mz
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ---------- Só POST ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'message' => 'Método não permitido.']);
  exit;
}

// ---------- Lê corpo (JSON ou form) ----------
$raw = file_get_contents('php://input');
$data = null;

$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($ctype, 'application/json') !== false) {
  $data = json_decode($raw, true);
} else {
  // fallback para form tradicional
  $data = $_POST;
}

$nome     = trim($data['nome']     ?? '');
$email    = trim($data['email']    ?? '');
$assunto  = trim($data['assunto']  ?? '');
$mensagem = trim($data['mensagem'] ?? '');
$website  = trim($data['website']  ?? ''); // honeypot (deve vir vazio)

// ---------- Validações ----------
if ($website !== '') { // bot/Spam
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Verificação anti-spam falhou.']);
  exit;
}

if ($nome === '' || $email === '' || $assunto === '' || $mensagem === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Preencha todos os campos obrigatórios.']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Email inválido.']);
  exit;
}

// ---------- Configura o envio ----------
$to   = 'geral@vt.co.mz';             // 🟠 DESTINATÁRIO: ajuste aqui
$from = 'noreply@vt.co.mz';           // 🟠 Remetente técnico do domínio
$subject = '📩 [Site VT] ' . $assunto;

// Monta corpo (texto simples) — também poderias gerar HTML se preferires
$bodyText = "Nova mensagem pelo website (Formulário de Contacto)\n\n"
          . "Nome: {$nome}\n"
          . "Email: {$email}\n"
          . "Assunto: {$assunto}\n"
          . "Mensagem:\n{$mensagem}\n\n"
          . "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'desconhecido') . "\n"
          . "User-Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? '-') . "\n";

// Cabeçalhos — usa From do teu domínio para evitar rejeição por SPF/DMARC
$headers  = [];
$headers[] = "From: VT Website <{$from}>";
$headers[] = "Reply-To: {$nome} <{$email}>";
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=UTF-8";
$headers[] = "X-Mailer: PHP/" . phpversion();

$ok = @mail($to, '=?UTF-8?B?'.base64_encode($subject).'?=', $bodyText, implode("\r\n", $headers));

if ($ok) {
  echo json_encode(['ok' => true, 'message' => 'Mensagem enviada com sucesso.']);
  exit;
} else {
  // Muitas hospedagens bloqueiam mail(); se falhar, podes trocar para SMTP (PHPMailer)
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'message' => 'Não foi possível enviar agora. Tente novamente mais tarde.'
  ]);
  exit;
}