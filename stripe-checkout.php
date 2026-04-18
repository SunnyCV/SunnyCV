<?php
require_once 'stripe-php/init.php';

\Stripe\Stripe::setApiKey('YOUR_SECRET_KEY_HERE');

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$items = isset($input['items']) ? $input['items'] : [];

if (empty($items)) {
    http_response_code(400);
    echo json_encode(['error' => 'No items in cart']);
    exit;
}

$line_items = [];
foreach ($items as $item) {
    $line_items[] = [
        'price_data' => [
            'currency'     => 'usd',
            'unit_amount'  => intval(floatval($item['price']) * 100),
            'product_data' => [
                'name'   => $item['name'] . ' — Size: ' . $item['size'],
                'images' => [
                    'https://madewith-luv.com/' . $item['front']
                ],
            ],
        ],
        'quantity' => 1,
    ];
}

try {
    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items'           => $line_items,
        'mode'                 => 'payment',
        'success_url'          => 'https://madewith-luv.com/success.html?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url'           => 'https://madewith-luv.com/cancel.html',
        'shipping_address_collection' => [
            'allowed_countries' => ['US'],
        ],
        'phone_number_collection' => [
            'enabled' => true,
        ],
    ]);

    echo json_encode(['url' => $session->url]);
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
