using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinguaSwap.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalizedContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DescriptionI18nJson",
                table: "Libraries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameI18nJson",
                table: "Libraries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotesI18nJson",
                table: "Entries",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionI18nJson",
                table: "Libraries");

            migrationBuilder.DropColumn(
                name: "NameI18nJson",
                table: "Libraries");

            migrationBuilder.DropColumn(
                name: "NotesI18nJson",
                table: "Entries");
        }
    }
}
