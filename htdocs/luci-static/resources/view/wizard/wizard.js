'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require rpc';
'require form';

return view.extend({
	load: function() {
		return Promise.all([
			uci.changes(),
			uci.load('wireless'),
			uci.load('wizard')
		]);
	},

	render: function(data) {

		var m, s, o;
		var has_wifi = false;

		if (uci.sections('wireless', 'wifi-device').length > 0) {
			has_wifi = true;
		}

		m = new form.Map('wizard', [_('Inital Router Setup')],
			_('If you are using this router for the first time, please configure it here.'));

		s = m.section(form.NamedSection, 'default', 'wizard');
		s.addremove = false;
		
		s.tab('general', _('General Settings'), _('Basic device role and operation mode.'));
		s.tab('wansetup', _('Wan Settings'), _('Internet connection settings (only for Main Router mode).'));
		if (has_wifi) {
			s.tab('wifisetup', _('Wireless Settings'), _('Wireless and Mesh configuration.'));
		}
		s.tab('lansetup', _('Lan Settings'));
		s.tab('advanced', _('Advanced Settings'), _('System optimization and services.'));

		// --- General Tab ---
		o = s.taboption('general', form.ListValue, 'op_mode', _('Operation Mode'));
		o.value('router', _('Main Router'));
		o.value('node', _('Mesh Node / Dumb AP'));
		o.default = 'router';
		o.description = _('Router mode manages Internet. Node mode bridges WAN to LAN.');

		o = s.taboption('general', form.Value, 'hostname', _('Hostname'));
		o.placeholder = 'OpenWrt';

		// --- WAN Tab ---
		o = s.taboption('wansetup', form.ListValue, 'wan_proto', _('Protocol'));
		o.rmempty = false;
		o.default = 'dhcp';
		o.value('dhcp', _('DHCP client'));
		o.value('static', _('Static address'));
		o.value('pppoe', _('PPPoE'));
		o.depends('op_mode', 'router');

		o = s.taboption('wansetup', form.Value, 'wan_pppoe_user', _('PAP/CHAP username'));
		o.depends({wan_proto: 'pppoe', op_mode: 'router'});

		o = s.taboption('wansetup', form.Value, 'wan_pppoe_pass', _('PAP/CHAP password'));
		o.depends({wan_proto: 'pppoe', op_mode: 'router'});
		o.password = true;

		o = s.taboption('wansetup', form.Value, 'wan_ipaddr', _('IPv4 address'));
		o.depends('wan_proto', 'static');
		o.datatype = 'ip4addr';

		o = s.taboption('wansetup', form.Value, 'wan_netmask', _('IPv4 netmask'));
		o.depends('wan_proto', 'static');
		o.datatype = 'ip4addr';

		o = s.taboption('wansetup', form.Value, 'wan_gateway', _('IPv4 gateway'));
		o.depends('wan_proto', 'static');
		o.datatype = 'ip4addr';

		o = s.taboption('wansetup', form.DynamicList, 'wan_dns', _('Use custom DNS servers'));
		o.datatype = 'ip4addr';
		o.cast = 'string';
		o.depends('op_mode', 'router');

		// --- Wireless Tab ---
		if (has_wifi) {
			o = s.taboption('wifisetup', form.ListValue, 'wifi_mode', _('Wifi Strategy'));
			o.value('standard', _('Standard Access Point'));
			o.value('mesh', _('Mesh Backhaul (Hybrid)'));
			o.default = 'standard';
			o.description = _('Standard: All radios are APs. Mesh: 2.4G is AP, 5G is Mesh Backhaul (802.11s).');
			
			// AP SETTINGS (Visible for Both Standard and Mesh for the 2.4G radio)
			o = s.taboption('wifisetup', form.Value, 'wifi_ssid', _('Wifi Name (SSID)'));
			o.datatype = 'maxlength(32)';
			o.description = _('Name for the local Access Point (2.4G).');

			o = s.taboption("wifisetup", form.Value, "wifi_key", _("Wifi Password"));
			o.datatype = 'wpakey';
			o.password = true;

			// MESH SPECIFIC SETTINGS (Only visible in Mesh Mode)
			o = s.taboption('wifisetup', form.SectionValue, 'mesh_divider', form.NamedSection, 'default', 'wizard', _('Mesh Configuration (5G)'));
			o.depends('wifi_mode', 'mesh');

			o = s.taboption('wifisetup', form.Value, 'mesh_id', _('Mesh ID'));
			o.datatype = 'maxlength(32)';
			o.depends('wifi_mode', 'mesh');
			o.description = _('ID for the 802.11s Mesh Network.');

			o = s.taboption('wifisetup', form.Flag, 'mesh_fwding', _('Mesh Forwarding'));
			o.default = '1';
			o.depends('wifi_mode', 'mesh');

			o = s.taboption('wifisetup', form.Value, 'mesh_rssi_threshold', _('Mesh RSSI Threshold'));
			o.datatype = 'integer';
			o.default = '0';
			o.depends('wifi_mode', 'mesh');
		}

		// --- LAN Tab ---
		o = s.taboption('lansetup', form.Value, 'lan_ipaddr', _('IPv4 address'));
		o.datatype = 'ip4addr';

		o = s.taboption('lansetup', form.Value, 'lan_netmask', _('IPv4 netmask'));
		o.datatype = 'ip4addr';
		o.value('255.255.255.0');

		o = s.taboption('lansetup', form.Value, 'lan_gateway', _('IPv4 Gateway'));
		o.datatype = 'ip4addr';
		o.depends('op_mode', 'node');

		o = s.taboption('lansetup', form.DynamicList, 'lan_dns', _('DNS Servers'));
		o.datatype = 'ip4addr';
		o.depends('op_mode', 'node');

		// --- Advanced Tab ---
		o = s.taboption('advanced', form.Flag, 'timezone_africa_cairo', _('Set Timezone to Africa/Cairo'));
		o.default = '0';

		o = s.taboption('advanced', form.ListValue, 'dns_service', _('DNS Service'));
		o.value('dnsmasq', 'Dnsmasq');
		o.value('adguardhome', 'AdGuard Home');
		o.default = 'adguardhome';

		o = s.taboption('advanced', form.Flag, 'cake_autorate', _('Enable CAKE Autorate'));
		o.default = '0';

		o = s.taboption('advanced', form.Flag, 'mt6000_tweaks', _('MT6000 Performance Tweaks'));
		o.default = '0';

		o = s.taboption('advanced', form.Flag, 'firewall_enabled', _('Enable Firewall'));
		o.default = '1';
		o.depends('op_mode', 'router');

		o = s.taboption('advanced', form.Flag, 'nat_enabled', _('Enable NAT'));
		o.default = '1';
		o.depends('op_mode', 'router');

		o = s.taboption('advanced', form.Flag, 'hw_offload', _('Hardware Flow Offloading'));
		o.default = '1';

		o = s.taboption('advanced', form.Flag, 'sw_offload', _('Software Flow Offloading'));
		o.default = '0';

		o = s.taboption('advanced', form.Flag, 'tcp_bbr', _('Enable TCP BBR'));
		o.default = '0';

		o = s.taboption('advanced', form.Flag, 'ipv6_enabled', _('Enable IPv6'));
		o.default = '0';

		return m.render();
	}
});