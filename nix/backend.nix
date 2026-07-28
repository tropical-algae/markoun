{
  lib,
  pkgs,
  frontend,
  pyproject-nix,
  pyproject-build-systems,
  workspace,
  workspaceOverlay,
}:
let
  python = pkgs.python313;
  pythonBase = pkgs.callPackage pyproject-nix.build.packages {
    inherit python;
  };
  pythonSet = pythonBase.overrideScope (
    lib.composeManyExtensions [
      pyproject-build-systems.overlays.wheel
      workspaceOverlay
      (final: prev: {
        markoun = prev.markoun.overrideAttrs (old: {
          postInstall = (old.postInstall or "") + ''
            resourceRoot="$out/${python.sitePackages}/markoun/_standalone"
            mkdir -p "$resourceRoot/web"
            cp -r ${frontend}/share/markoun/web/. "$resourceRoot/web/"
            cp ${../welcome.md} "$resourceRoot/welcome.md"
          '';
        });
      })
    ]
  );
  venv = pythonSet.mkVirtualEnv "markoun-env" { markoun = [ ]; };
  inherit (pkgs.callPackages pyproject-nix.build.util { }) mkApplication;
in
mkApplication {
  inherit venv;
  package = pythonSet.markoun;
}
