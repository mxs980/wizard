#
# Copyright (C) 2017-2025
#
# This is free software, licensed under the GNU General Public License v3.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-wizard
# BUMP THIS VERSION to ensure the router updates the package
PKG_VERSION:=1.0.2
PKG_RELEASE:=1

PKG_LICENSE:=GPLv3
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Sobhy <sobhy@example.com>

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-wizard
	# Improved Category for better menu placement
	CATEGORY:=LuCI
	SUBMENU:=3. Applications
	TITLE:=LuCI Support for Wizard (MT6000 Optimized)
	PKGARCH:=all
	# Add dependencies here if you want them installed automatically.
	# Example: +luci-base +rpcd-mod-iwinfo +adguardhome +luci-app-turboacc
	DEPENDS:=+luci-base +rpcd-mod-iwinfo
endef

define Package/luci-app-wizard/description
	LuCI Support for Setup Wizard. 
	Includes optimizations for MT6000, Mesh Setup, and AdGuard Home config.
endef

define Build/Prepare
	# Compiles translation files (.po) to binary (.lmo)
	$(foreach po,$(wildcard ${CURDIR}/files/luci/i18n/*.po), \
		po2lmo $(po) $(PKG_BUILD_DIR)/$(patsubst %.po,%.lmo,$(notdir $(po)));)
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-app-wizard/conffiles
/etc/config/wizard
endef

define Package/luci-app-wizard/postinst
#!/bin/sh
if [ -z "$$IPKG_INSTROOT" ]; then
  # Run the UCI defaults script immediately after install
  ( . /etc/uci-defaults/40_luci-app-wizard )
  rm -f /etc/uci-defaults/40_luci-app-wizard

  # Clear LuCI cache so new menus appear
  rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
fi

exit 0
endef

define Package/luci-app-wizard/install
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/i18n
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/wizard.*.lmo $(1)/usr/lib/lua/luci/i18n/
	
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DATA) ./root/etc/config/wizard $(1)/etc/config/wizard
	
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/wizard $(1)/etc/init.d/wizard
	
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DATA) ./root/etc/uci-defaults/40_luci-app-wizard $(1)/etc/uci-defaults/40_luci-app-wizard
	
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/*.json $(1)/usr/share/rpcd/acl.d/
	
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/*.json $(1)/usr/share/luci/menu.d/
	
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/wizard
	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/wizard/wizard.js $(1)/www/luci-static/resources/view/wizard/wizard.js
	
	$(INSTALL_DIR) $(1)/usr/share/ucitrack
	$(INSTALL_DATA) ./root/usr/share/ucitrack/*.json $(1)/usr/share/ucitrack/
endef

$(eval $(call BuildPackage,luci-app-wizard))