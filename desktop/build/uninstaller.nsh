; this should be the same uninstall behaviour as previously defined
!macro customUnInstall
  ${ifNot} ${isUpdated}
    RMDir /r "$PROFILE\.cleard"
  ${endIf}
!macroend
