@php $q = $inquiry; @endphp
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;background:#1b1b1d;font-family:Arial,Helvetica,sans-serif;color:#1b1b1d;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1b1b1d;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#f4f4f2;">
    <tr><td style="background:#1b1b1d;border-bottom:4px solid #d7141a;padding:20px 24px;">
        <div style="color:#c7c9cc;font-size:12px;letter-spacing:3px;text-transform:uppercase;">LCT Trading · New inquiry</div>
        <div style="color:#ffffff;font-size:22px;font-weight:bold;margin-top:6px;">{{ $q->topicLabel() }}</div>
        <div style="color:#c7c9cc;font-size:13px;margin-top:4px;">{{ $q->created_at->timezone('Asia/Manila')->format('M j, Y g:i A') }}</div>
    </td></tr>
    <tr><td style="padding:20px 24px 8px;">
        <div style="font-size:18px;font-weight:bold;">{{ $q->name }}</div>
        <div style="font-size:15px;margin-top:4px;"><a href="tel:{{ preg_replace('/[^0-9+]/', '', $q->phone) }}" style="color:#d7141a;font-weight:bold;">{{ $q->phone }}</a>@if ($q->email) · <a href="mailto:{{ $q->email }}" style="color:#1b1b1d;">{{ $q->email }}</a>@endif</div>
    </td></tr>
    <tr><td style="padding:8px 24px 24px;font-size:15px;line-height:1.6;white-space:pre-line;">{{ $q->message }}</td></tr>
    <tr><td style="padding:0 24px 24px;">
        <a href="{{ route('admin.inquiries.show', $q) }}" style="display:inline-block;background:#d7141a;color:#ffffff;font-weight:bold;text-decoration:none;padding:12px 20px;font-size:14px;">Open in admin</a>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
