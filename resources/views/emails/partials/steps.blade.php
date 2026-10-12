{{-- Three tinted "what happens next" cards. Expects $steps: list of [label, title, text]. --}}
<tr><td style="padding:24px 28px 4px;">
    <div style="font-size:16px;font-weight:800;">{{ $heading ?? 'What happens next' }}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
            @foreach ($steps as $i => [$label, $title, $text])
                <td width="33%" style="vertical-align:top;padding:{{ $i === 0 ? '0 6px 0 0' : ($i === count($steps) - 1 ? '0 0 0 6px' : '0 3px') }};">
                    <div style="background:#fbeeee;border-radius:12px;padding:16px 14px;height:100%;">
                        <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#d7141a;">{{ $label }}</div>
                        <div style="margin-top:6px;font-size:14px;font-weight:800;line-height:1.3;">{{ $title }}</div>
                        <div style="margin-top:6px;font-size:12.5px;line-height:1.55;color:#55575b;">{{ $text }}</div>
                    </div>
                </td>
            @endforeach
        </tr>
    </table>
</td></tr>
