using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinguaSwap.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddJourneyState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JourneyStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    LibraryId = table.Column<int>(type: "INTEGER", nullable: false),
                    SourceLanguage = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    TargetLanguage = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    StateJson = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JourneyStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JourneyStates_Libraries_LibraryId",
                        column: x => x.LibraryId,
                        principalTable: "Libraries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JourneyStates_LibraryId",
                table: "JourneyStates",
                column: "LibraryId");

            migrationBuilder.CreateIndex(
                name: "IX_JourneyStates_UserId_LibraryId_SourceLanguage_TargetLanguage",
                table: "JourneyStates",
                columns: new[] { "UserId", "LibraryId", "SourceLanguage", "TargetLanguage" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JourneyStates");
        }
    }
}
