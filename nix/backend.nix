{
  lib,
  pkgs,
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
    ]
  );
  venv = pythonSet.mkVirtualEnv "markoun-env" { markoun = [ ]; };
  inherit (pkgs.callPackages pyproject-nix.build.util { }) mkApplication;
in
mkApplication {
  inherit venv;
  package = pythonSet.markoun;
}
