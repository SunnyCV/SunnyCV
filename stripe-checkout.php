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
                    'https://madewith-luv.com/' . str_replace(' ', '%20', $item['front'])
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
            'allowed_countries' => ['AC','AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CV','CW','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MK','ML','MM','MN','MO','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SZ','TA','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','US','UY','UZ','VA','VC','VE','VG','VN','VU','WF','WS','XK','YE','YT','ZA','ZM','ZW'],
        ],
        'shipping_options' => [
            ['shipping_rate' => 'shr_1TNeiKHXEAGWgeFQajPs1O2p'],
            ['shipping_rate' => 'shr_1TNeihHXEAGWgeFQsALHmxJ6'],
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
