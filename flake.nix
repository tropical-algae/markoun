{
  description = "Markoun - a self-hosted, file-based Markdown editor";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixpkgs-darwin-x86.url = "github:NixOS/nixpkgs/nixpkgs-26.05-darwin";

    pyproject-nix = {
      url = "github:pyproject-nix/pyproject.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    uv2nix = {
      url = "github:pyproject-nix/uv2nix";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.pyproject-nix.follows = "pyproject-nix";
    };

    pyproject-build-systems = {
      url = "github:pyproject-nix/build-system-pkgs";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.pyproject-nix.follows = "pyproject-nix";
      inputs.uv2nix.follows = "uv2nix";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      nixpkgs-darwin-x86,
      pyproject-nix,
      uv2nix,
      pyproject-build-systems,
      ...
    }:
    let
      inherit (nixpkgs) lib;

      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      forAllSystems = lib.genAttrs systems;
      projectVersion = (builtins.fromTOML (builtins.readFile ./pyproject.toml)).project.version;
      workspace = uv2nix.lib.workspace.loadWorkspace { workspaceRoot = ./.; };
      workspaceOverlay = workspace.mkPyprojectOverlay {
        sourcePreference = "wheel";
      };

      packagesFor =
        system:
        let
          # Unstable no longer evaluates on Intel macOS; 26.05 is its final
          # supported Nixpkgs release.
          packageSource =
            if system == "x86_64-darwin" then nixpkgs-darwin-x86 else nixpkgs;
          pkgs = packageSource.legacyPackages.${system};
          frontend = pkgs.callPackage ./nix/frontend.nix {
            version = projectVersion;
          };
          backend = import ./nix/backend.nix {
            inherit
              lib
              pkgs
              pyproject-nix
              pyproject-build-systems
              workspace
              workspaceOverlay
              ;
          };
          markoun = pkgs.callPackage ./nix/package.nix {
            inherit backend frontend;
            version = projectVersion;
          };
        in
        {
          inherit backend frontend markoun;
          default = markoun;
        };
    in
    {
      packages = forAllSystems packagesFor;

      apps = forAllSystems (system: {
        default = {
          type = "app";
          program = "${self.packages.${system}.default}/bin/markoun";
          meta = self.packages.${system}.default.meta;
        };
      });

      checks = forAllSystems (system: {
        inherit (self.packages.${system}) backend frontend markoun;
      });
    };
}
