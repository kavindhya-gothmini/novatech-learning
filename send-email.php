<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use PHPMailer\PHPMailer\PHPMailer;

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

/**
 * Return a JSON response and stop execution.
 */
function respond(int $statusCode, string $message): never
{
    http_response_code($statusCode);

    echo json_encode([
        'success' => $statusCode >= 200 && $statusCode < 300,
        'message' => $message,
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/**
 * Accept POST requests only.
 */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'Please submit the contact form to send your enquiry.');
}

/**
 * Project paths.
 *
 * Expected structure:
 * tutor-portfolio/
 * ├── send-email.php
 * ├── .env
 * ├── composer.json
 * └── vendor/
 *     └── autoload.php
 */
$projectRoot = __DIR__;
$autoloadPath = $projectRoot . DIRECTORY_SEPARATOR . 'vendor/autoload.php';
$envPath = $projectRoot . DIRECTORY_SEPARATOR . '.env';

/**
 * Check Composer dependencies.
 */
if (!is_file($autoloadPath)) {
    error_log('NovaTech: vendor/autoload.php was not found.');

    respond(
        500,
        'Email dependencies are missing. Run Composer install in your project folder.'
    );
}

require_once $autoloadPath;

/**
 * Check required library classes.
 */
if (
    !class_exists(Dotenv::class) ||
    !class_exists(PHPMailer::class)
) {
    error_log(
        'NovaTech: Required Dotenv or PHPMailer class is unavailable. Check Composer dependencies.'
    );

    respond(
        500,
        'Required email libraries are unavailable. Run the Composer installation command.'
    );
}

/**
 * Check the .env file.
 */
if (!is_file($envPath) || !is_readable($envPath)) {
    error_log('NovaTech: .env file is missing or unreadable.');

    respond(
        500,
        'The .env configuration file was not found. Check that it is beside send-email.php.'
    );
}

/**
 * Load environment settings.
 */
try {
    $dotenv = Dotenv::createImmutable($projectRoot);
    $dotenv->load();
} catch (Throwable $exception) {
    // Detailed diagnostics go to the server log, never to the visitor.
    error_log(
        'NovaTech: .env loading failed: ' . $exception->getMessage()
    );

    respond(
        500,
        'The email configuration could not be loaded. Check the .env file format and PHP error log.'
    );
}

/**
 * Discourage automated spam using a honeypot field.
 * The contact form should contain an empty input named "website".
 */
if (!empty($_POST['website'] ?? '')) {
    respond(400, 'Your enquiry could not be submitted.');
}

/**
 * Read and normalize submitted form data.
 */
$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$subject = trim((string) ($_POST['subject'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

$name = preg_replace('/[\r\n]+/', ' ', $name) ?? '';
$email = preg_replace('/[\r\n]+/', '', $email) ?? '';

/**
 * Allowed subjects must match the HTML form option values.
 */
$allowedSubjects = [
    'Programming',
    'Web Development',
    'Desktop Application Development',
    'Database Management',
    'Software Engineering',
    'IT Fundamentals',
    'Data Science Fundamentals',
    'Project Guidance',
    'Assignment Guidance',
    'Exam Preparation',
    'Other',
];

/**
 * Validate form fields.
 */
if (
    $name === '' ||
    !mb_check_encoding($name, 'UTF-8') ||
    mb_strlen($name, 'UTF-8') > 100 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($email) > 254 ||
    !in_array($subject, $allowedSubjects, true) ||
    $message === '' ||
    !mb_check_encoding($message, 'UTF-8') ||
    mb_strlen($message, 'UTF-8') > 5000
) {
    respond(
        422,
        'Please check your details and complete all fields correctly.'
    );
}

/**
 * Per-session submission cooldown.
 */
if (
    isset($_SESSION['last_contact_sent']) &&
    time() - (int) $_SESSION['last_contact_sent'] < 30
) {
    respond(
        429,
        'Please wait 30 seconds before sending another enquiry.'
    );
}

/**
 * Read SMTP settings.
 */
$host = trim((string) ($_ENV['MAIL_HOST'] ?? ''));
$port = filter_var(
    $_ENV['MAIL_PORT'] ?? '587',
    FILTER_VALIDATE_INT
);
$encryption = strtolower(
    trim((string) ($_ENV['MAIL_ENCRYPTION'] ?? 'tls'))
);
$username = trim((string) ($_ENV['MAIL_USERNAME'] ?? ''));
$password = trim((string) ($_ENV['MAIL_PASSWORD'] ?? ''));
$fromAddress = trim((string) ($_ENV['MAIL_FROM_ADDRESS'] ?? ''));
$fromName = trim((string) ($_ENV['MAIL_FROM_NAME'] ?? 'NovaTech Learning'));
$toAddress = trim((string) ($_ENV['MAIL_TO_ADDRESS'] ?? ''));

/**
 * Validate SMTP settings without exposing their values.
 */
if (
    $host === '' ||
    $port === false ||
    $port < 1 ||
    $port > 65535 ||
    $username === '' ||
    $password === '' ||
    !filter_var($username, FILTER_VALIDATE_EMAIL) ||
    !filter_var($fromAddress, FILTER_VALIDATE_EMAIL) ||
    !filter_var($toAddress, FILTER_VALIDATE_EMAIL) ||
    $fromName === '' ||
    !in_array($encryption, ['tls', 'ssl'], true)
) {
    error_log(
        'NovaTech: One or more required SMTP settings are missing or invalid.'
    );

    respond(
        500,
        'The email service is not configured correctly. Check all required MAIL settings in .env.'
    );
}

/**
 * Send the enquiry through SMTP.
 */
try {
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host = $host;
    $mail->SMTPAuth = true;
    $mail->Username = $username;
    $mail->Password = $password;

    $mail->SMTPSecure = $encryption === 'ssl'
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;

    $mail->Port = (int) $port;
    $mail->CharSet = 'UTF-8';
    $mail->Timeout = 20;

    // Use the authenticated email address as the sender.
    $mail->setFrom($fromAddress, $fromName);

    // Deliver the enquiry to the configured inbox.
    $mail->addAddress($toAddress, 'NovaTech Learning');

    // Allow the recipient to reply directly to the visitor.
    $mail->addReplyTo($email, $name);

    $mail->isHTML(false);
    $mail->Subject = 'NovaTech Learning Enquiry - ' . $subject;

    $mail->Body =
        "New enquiry received through the NovaTech Learning website.\n\n" .
        "Name: {$name}\n" .
        "Email: {$email}\n" .
        "Subject: {$subject}\n\n" .
        "Message:\n{$message}\n";

    $mail->send();

    $_SESSION['last_contact_sent'] = time();

    respond(
        200,
        'Your enquiry was sent successfully. Thank you for contacting NovaTech Learning!'
    );

} catch (Throwable $exception) {
    // Keep SMTP details and credentials out of the public response.
    error_log(
        'NovaTech enquiry email failed: ' . $exception->getMessage()
    );

    respond(
        500,
        'Your enquiry could not be sent right now. Check the XAMPP PHP error log and try again.'
    );
}